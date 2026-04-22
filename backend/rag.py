### Script adapted from "rag_demo_toolistic in-class" from lecture activity

from typing import Tuple, List
from dotenv import load_dotenv
import os
from infosci_spark_client import LLMClient
from backend.search_wines import display_results, search_wines, load_resources

# load API key
load_dotenv()
client = LLMClient(api_key=os.getenv("SPARK_API_KEY"))

# load datset
df, _, _, _, _ = load_resources()

df["rag_text"] = (
    "Description: " + df["description"].fillna("") + "\n" +
    "Variety: " + df["variety"].fillna("") + "\n" +
    "Region: " + df["region_1"].fillna("") + ", " + df["province"].fillna("") + "\n" +
    "Country: " + df["country"].fillna("")
)

# create sample dataset
def build_df_sample(df, n=20):
  return"\n".join(df['rag_text']
                  .dropna()
                  .drop_duplicates()
                  .head(n)
                  .tolist())

SAMPLE_DESCRIPTIONS = build_df_sample(df)

# Max wines returned by search API; chat/RAG query rewrite still uses a small slice in build_context().
SEARCH_TOP_K = 50

# check quality of retrieval
def is_good_retrieval(results, threshold = 0.3):
  if not results:
    return False
  return results[0].get("similarity", 0) >= threshold

# build context for LLM
def build_context(results, sample_descriptions, k=15):
  if is_good_retrieval(results):
    return "\n".join([
      r["description"] for r in results[:k] if r.get("description")
    ])
  else:
    return sample_descriptions

# rewrite query
def rewrite_query(user_query, context):
  prompt = [
    {
      "role": "system",
      "content": f"""
You improve search queries for a food and wine pairing information retrieval system. The user enters a meal or food as the query. You should rewrite the query to better capture the flavor, texture, or food type to improve search results. If the original query is already good, you can return it as is.

Wine descriptions look like: {context}

Generate 3 better search queries.

Rules:
- Focus on flavor, texture, or food type
- Keep them short
- Return ONLY a Python list
- DO NOT include markdown, backticks, or code fences
"""
    },
    {
      "role": "user",
      "content": user_query
    },
  ]
  response = client.chat(prompt, stream=False, show_thinking=False)
  query_suggestions = response["content"].strip()
  try:
    return eval(query_suggestions)
  except:
    return [query_suggestions]
  
def run_query_with_suggestions(user_query, sample_descriptions):
  data = search_wines(user_query, top_k=SEARCH_TOP_K)
  results = data["results"]

  if results:
    context = build_context(results, sample_descriptions)
  else:
    context = sample_descriptions

  suggestions = rewrite_query(user_query, context)

  return {
    "original_query": user_query,
    "results": results,
    "comparisons": data["comparisons"],
    "latent_dimensions": data.get("latent_dimensions", []),
    "suggested_queries": suggestions,
    "no_strong_matches": data.get("no_strong_matches", False),
  }

def main():
  """
  Simple CLI for manual testing.
  """
  query = input("Enter a food or meal description: ")
  data = run_query_with_suggestions(query, SAMPLE_DESCRIPTIONS)
  print("\nOriginal Query:", data["original_query"])
  print("\nSuggested Queries:")
  for idx, suggestion in enumerate(data["suggested_queries"], 1):
    print(f"{idx}. {suggestion}")
  print("\nSearch Results:")
  display_results(data["results"])


if __name__ == "__main__":
  main()