### This script builds the TF-IDF vectorizer and matrix for the POURfect project.
# It loads the dataset cleaned in the preprocess_data.py script, combines
# relevant text columns into a single document for each wine, and then
# creates a TF-IDF vector representation of the combined text. The resulting TF-IDF
# matrix and vectorizer are saved to disk for use in the search functionality.
### This script as created with the help of ChatGPT. ChatGPT was used for 
# guidance with the pipeline of the application and getting started with the code.

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
import pickle

#DATA_DIR = Path("backend/data")
DATA_DIR = Path(__file__).resolve().parent / "data"

def load_dataset():
  path = DATA_DIR / "cleaned_wine_reviews.csv"
  df = pd.read_csv(path)
  print("Dataset loaded with shape:", df.shape)
  return df

def create_document(df):
  """
  Combine the columns that contain useful semantic information
  for matching food queries with wines.
  """

  df["combined_text"] = (
    df["description"].fillna("") + " " +
    df["variety"].fillna("") + " " +
    df["designation"].fillna("") + " " +
    # df["title"].fillna("") + " " +
    # df["winery"].fillna("") + " " +
    df["country"].fillna("") + " " +
    df["province"].fillna("") + " " +
    df["region_1"].fillna("")
  )

  return df

def build_tfidf(df):
  """
  Build the TF-IDF vector representation.
  """
  vectorizer = TfidfVectorizer(
    stop_words="english",
    max_features=20000,
    min_df = 5,
    max_df = 0.8
  )

  X = vectorizer.fit_transform(df["combined_text"])

  print("TF-IDF matrix shape:", X.shape)

  return vectorizer, X

def apply_svd(X, n_components=300):
    """
    Apply Truncated SVD to reduce dimensionality of TF-IDF matrix.
    """
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    X_reduced = svd.fit_transform(X)

    print("SVD reduced matrix shape:", X_reduced.shape)

    return svd, X_reduced

def save_index(vectorizer, svd, X):
  """
  Save the TF-IDF vectorizer and vectorizer.
  """
  
  matrix_path = DATA_DIR / "tfidf_svd_matrix.npy"
  vectorizer_path = DATA_DIR / "tfidf_vectorizer.pkl"
  svd_path = DATA_DIR / "svd_model.pkl"

  np.save(matrix_path, X)

  with open(vectorizer_path, "wb") as f:
    pickle.dump(vectorizer, f)

  with open(svd_path, "wb") as f:
    pickle.dump(svd, f)

  print(f"TF-IDF matrix + SVD index saved to {matrix_path}")

def main():
  
  df = load_dataset()

  df = create_document(df)

  vectorizer, X = build_tfidf(df)
  svd, X_reduced = apply_svd(X)

  save_index(vectorizer, svd, X_reduced)

if __name__ == "__main__":
  main()