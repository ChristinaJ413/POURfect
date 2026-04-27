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
  You improve search queries for a food-to-wine retrieval system.

  The goal is NOT to decide the best wine pairing.
  The goal is to rewrite the query so it uses words and phrases
  that appear in wine descriptions.

  You are given:
  - A food query
  - Wine descriptions from the dataset

  Original query:
  {user_query}

  Wine descriptions:
  {context}

  Instructions:
  - Keep the original food as the core of every query
  - Add only flavor or tasting-note words that are directly related to the food
  - Use words that appear in or are strongly implied by the wine descriptions
  - Focus on ingredients and flavors in the dish

  Example:
  - Original query: "pizza"
  - Rewritten query: "pizza with tomato and herbs" (because many wine descriptions mention "tomato" and "herbs", which are common pizza ingredients)

  Strict rules:
  - Every query MUST include the original food (or a very close variant)
  - Added words must be logically connected to the food (not generic wine terms)
  - Do NOT invent unrelated concepts (e.g., do not add "berry" to pizza unless clearly justified)
  - Do NOT convert the query into wine types (no "red wine", "tannins", etc.)
  - Do NOT describe wine structure (no acidity, body, tannins)

  Generate 4 improved queries.

  Formatting rules:
  - Short phrases (3–6 words)
  - No commas
  - No full sentences
  - Return ONLY a Python list
  - No markdown, no backticks
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

  rewritten_query = suggestions[0] if suggestions else user_query

  new_data = search_wines(rewritten_query, top_k=SEARCH_TOP_K)
  new_results = new_data["results"]

  if not is_good_retrieval(new_results):
    final_data = data
    final_query = user_query
  else:
    final_data = new_data
    final_query = rewritten_query

  return {
    "original_query": user_query,
    "rewritten_query": rewritten_query,
    "results": final_data["results"],
    "comparisons": final_data["comparisons"],
    "latent_dimensions": final_data.get("latent_dimensions", []),
    "suggested_queries": suggestions[1:] if len(suggestions) > 1 else [],
    "no_strong_matches": final_data.get("no_strong_matches", False),
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