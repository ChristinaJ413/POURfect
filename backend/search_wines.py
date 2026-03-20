### This script implements the search functionality for the POURfect project. 
# It loads the preprocessed dataset, TF-IDF matrix, and vectorizer, and allows 
# users to input a food or meal description to find matching wines based on 
# cosine similarity. The results are displayed in a readable format, showing the 
# wine's name, variety, winery, and description (and possibly other information).
### This script as created with the help of ChatGPT. ChatGPT was used for 
# guidance with the pipeline of the application and getting started with the code.

import pandas as pd
from pathlib import Path
import pickle
from scipy.sparse import load_npz, save_npz
from sklearn.metrics.pairwise import cosine_similarity
from backend.build_tfidf import load_dataset, create_document, build_tfidf

#DATA_DIR = Path("backend/data")
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

_df = None
_X = None
_vectorizer = None


def load_resources():
  """
  Load dataset, TF-IDF matrix, and vectorizer (cached).
  """
  global _df, _X, _vectorizer

  if _df is not None and _X is not None and _vectorizer is not None:
    return _df, _X, _vectorizer
  
  csv_path = DATA_DIR / "cleaned_wine_reviews.csv"
  matrix_path = DATA_DIR / "tfidf_matrix.npz"
  vectorizer_path = DATA_DIR / "tfidf_vectorizer.pkl"

  if matrix_path.exists() and vectorizer_path.exists() and csv_path.exists():
    print("Loading resources from disk...")

    df = pd.read_csv(csv_path)
    X = load_npz(matrix_path)

    with open(vectorizer_path, "rb") as f:
      vectorizer = pickle.load(f)

    print("Resources loaded successfully.")

  else:
    print("Resources not found on disk. Building from dataset...")
    df = load_dataset()
    df = create_document(df)

    vectorizer, X = build_tfidf(df)

    # Save resources to disk for future use
    save_npz(matrix_path, X)

    with open(vectorizer_path, "wb") as f:
      pickle.dump(vectorizer, f)

    print("Resources built and saved successfully.")
  
  _df, _X, _vectorizer = df, X, vectorizer

  return df, X, vectorizer


def search_wines(query, top_k=5):
  """
  Search for wines matching the food query and return a list of dicts
  suitable for JSON serialization.
  """
  if not query or not query.strip():
    return []

  df, X, vectorizer = load_resources()

  query_vec = vectorizer.transform([query])

  scores = cosine_similarity(query_vec, X)[0]

  top_indices = scores.argsort()[-top_k:][::-1]

  results = df.iloc[top_indices].copy()
  results["similarity"] = scores[top_indices]

  records = []
  for row in results.itertuples(index=False):
    records.append({
        "title": getattr(row, "title", None),
        "variety": getattr(row, "variety", None),
        "winery": getattr(row, "winery", None),
        "price": getattr(row, "price", None),
        "points": getattr(row, "points", None),
        "country": getattr(row, "country", None),
        "description": getattr(row, "description", None),
        "similarity": getattr(row, "similarity", None),
    })

  return records

def display_results(results):
  """
  Display the search results in a readable format.
  """

  for row in results:
      
      print("-" * 40)
      print(f"Wine: {row['title']}")
      print(f"Variety: {row['variety']}")
      print(f"Winery: {row['winery']}")
      print(f"Price: ${row['price']}")
      print(f"Points: {row['points']}")
      print(f"Country: {row['country']}")

      description = row["description"] or "No description available."
      print(f"Wine Description: {description[:200]}...")
      print("-" * 40)

def main():
  """
  Simple CLI for manual testing.
  """
  load_resources()
  query = input("Enter a food or meal description: ")
  results = search_wines(query)
  display_results(results)


if __name__ == "__main__":
  main()