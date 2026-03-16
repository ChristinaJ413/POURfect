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
from scipy.sparse import load_npz
from sklearn.metrics.pairwise import cosine_similarity

DATA_DIR = Path("backend/data")

def load_resources():
  """
  Load dataset, TF-IDF matrix, and vectorizer.
  """

  df = pd.read_csv(DATA_DIR / "cleaned_wine_reviews.csv")
  
  X = load_npz(DATA_DIR / "tfidf_matrix.npz")

  with open(DATA_DIR / "tfidf_vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

  print("Resources loaded successfully.")

  return df, X, vectorizer

def search_wines(query, df, X, vectorizer, top_k=10):
  """
  Search for wines matching the food query.
  """

  query_vec = vectorizer.transform([query])

  scores = cosine_similarity(query_vec, X)[0]

  top_indices = scores.argsort()[-top_k:][::-1]

  results = df.iloc[top_indices]

  return results[[
        "title",
        "variety",
        "winery",
        "price",
        "points",
        "country",
        "description"
    ]].to_dict(orient="records")

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
      print(f"Wine Description: {row['description'][:200]}...")
      print("-" * 40)

def main():

  df, X, vectorizer = load_resources()

  query = input("Enter a food or meal description: ")

  results = search_wines(query, df, X, vectorizer)

  display_results(results)

if __name__ == "__main__":
  main()