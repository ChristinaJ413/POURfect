import pickle
import numpy as np
from pathlib import Path
from backend.build_tfidf import load_dataset, create_document, build_tfidf, apply_svd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

def main():
    print("Building resources...")

    df = load_dataset()
    df = create_document(df)

    vectorizer, X = build_tfidf(df)
    svd, X_reduced = apply_svd(X)

    # Save everything
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    df.to_csv(DATA_DIR / "cleaned_wine_reviews.csv", index=False)
    np.save(DATA_DIR / "tfidf_svd_matrix.npy", X_reduced)

    with open(DATA_DIR / "tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)

    with open(DATA_DIR / "svd_model.pkl", "wb") as f:
        pickle.dump(svd, f)

    print("Resources built and saved to backend/data/")

if __name__ == "__main__":
    main()