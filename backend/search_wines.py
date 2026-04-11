### This script implements the search functionality for the POURfect project. 
# It loads the preprocessed dataset, TF-IDF matrix, and vectorizer, and allows 
# users to input a food or meal description to find matching wines based on 
# cosine similarity. The results are displayed in a readable format, showing the 
# wine's name, variety, winery, and description (and possibly other information).
### This script as created with the help of ChatGPT. ChatGPT was used for 
# guidance with the pipeline of the application and getting started with the code.

import pandas as pd
import numpy as np
from pathlib import Path
import pickle
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize

#DATA_DIR = Path("backend/data")
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

_df = None
_X = None
_vectorizer = None
_svd = None
_dim_labels = None

def build_dimension_labels(vectorizer, svd, top_n=5):
    """
    Build human-readable labels for each latent dimension
    using top contributing words.
    """
    terms = vectorizer.get_feature_names_out()
    dim_labels = {}

    for i, comp in enumerate(svd.components_):
        top_indices = comp.argsort()[-top_n:][::-1]
        top_words = [terms[j] for j in top_indices]

        dim_labels[i] = top_words

    return dim_labels

def load_resources():
    global _df, _X, _vectorizer, _svd, _dim_labels

    if _df is not None:
        return _df, _X, _vectorizer, _svd

    print("Loading resources and recomputing matrix...")

    csv_path = DATA_DIR / "cleaned_wine_reviews.csv"
    vectorizer_path = DATA_DIR / "tfidf_vectorizer.pkl"
    svd_path = DATA_DIR / "svd_model.pkl"
    matrix_path = DATA_DIR / "tfidf_svd_matrix.npy"

    assert csv_path.exists(), "Missing CSV"
    assert vectorizer_path.exists(), "Missing vectorizer"
    assert svd_path.exists(), "Missing SVD model"
    assert matrix_path.exists(), "Missing TF-IDF + SVD matrix"

    df = pd.read_csv(csv_path)

    with open(vectorizer_path, "rb") as f:
        vectorizer = pickle.load(f)

    with open(svd_path, "rb") as f:
        svd = pickle.load(f)

    with open(matrix_path, "rb") as f:
        X = np.load(f)
        X = normalize(X)

    if _dim_labels is None:
      _dim_labels = build_dimension_labels(vectorizer, svd)
    _df, _X, _vectorizer, _svd = df, X, vectorizer, svd

    return df, X, vectorizer, svd, _dim_labels


def search_wines(query, top_k=5, top_dims=10):
  """
  Search for wines matching the food query and return a list of dicts
  suitable for JSON serialization.
  """
  if not query or not query.strip():
    return {
      "results": [],
      "latent_dimensions": []
    }

  df, X, vectorizer, svd, dim_labels = load_resources()

  query_vec = vectorizer.transform([query])
  query_latent = svd.transform(query_vec)
  query_latent = normalize(query_latent)
  scores = cosine_similarity(query_latent, X)[0]

  query_latent_1d = query_latent[0]

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

  top_dim_indices = np.argsort(np.abs(query_latent_1d))[-top_dims:][::-1]

  latent_dimensions = []
  for idx in top_dim_indices:
    latent_dimensions.append({
      "dimension": int(idx + 1),
      "value": float(query_latent_1d[idx]),
      "label": ", ".join(dim_labels.get(idx, [])[:3])
    })

  return {
    "results": records,
    "latent_dimensions": latent_dimensions
  }

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
  data = search_wines(query)
  display_results(data["results"])
  print("Latent dimensions:", data["latent_dimensions"])


if __name__ == "__main__":
  main()