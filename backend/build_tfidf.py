### This script builds the TF-IDF vectorizer and matrix for the POURfect project.
# It loads the merged dataset created in the preprocess_data.py script, combines
# relevant text columns into a single document for each wine-food pairing, and then
# creates a TF-IDF vector representation of the combined text. The resulting TF-IDF
# matrix and vectorizer are saved to disk for use in the search functionality.
### This script as created with the help of ChatGPT. ChatGPT was used for 
# guidance with the pipeline of the application and getting started with the code.

import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import save_npz
import pickle

DATA_DIR = Path("data")

def load_dataset():
  path = DATA_DIR / "merged_POURfect_dataset.csv"
  df = pd.read_csv(path)
  print("Dataset loaded with shape:", df.shape)
  return df

def create_document(df):
  """
  Combine the columns that contain useful semantic information
  for matching food queries with wines.
  """

  df["combined_text"] = (
    df["food_item"].fillna("") + " " +
    df["cuisine"].astype(str).fillna("") + " " +
    df["description_x"].fillna("") + " " +
    df["description_y"].fillna("") + " " +
    df["variety"].fillna("") + " " +
    df["wine_type"].fillna("") + " " +
    df["wine_category"].fillna("") + " " +
    df["food_category"].fillna("")
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

def save_index(vectorizer, X):
  """
  Save the TF-IDF vectorizer and vectorizer.
  """
  
  matrix_path = DATA_DIR / "tfidf_matrix.npz"
  vectorizer_path = DATA_DIR / "tfidf_vectorizer.pkl"

  save_npz(matrix_path, X)

  with open(vectorizer_path, "wb") as f:
    pickle.dump(vectorizer, f)

  print(f"TF-IDF matrix saved to {matrix_path}")

def main():
  
  df = load_dataset()

  df = create_document(df)

  vectorizer, X = build_tfidf(df)

  save_index(vectorizer, X)

if __name__ == "__main__":
  main()