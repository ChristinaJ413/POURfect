### This script preprocesses the wine review dataset for use in the 
# POURfect project. The resulting dataset is saved as a CSV file for 
# further analysis and model training.
### This script as created with the help of ChatGPT. In P02, we created a
# dataset-exploration.ipynb notebook file where we explored the datasets
# and cleaned the data as seen below. This script essentially is a translation
# of that notebook into a Python script that can be run to preprocess the data
# for the POURfect project.
### In P02, we use two dataset: the wine reviews dataset and a food and wine
# pairing dataset. After further research, the food and wine pairing dataset
# is AI generated and not based on real data. Therefore, we will only be using 
# the wine reviews dataset for the POURfect project.

import pandas as pd

def clean_wine_reviews(path):
  df = pd.read_csv(path)

  df = df.drop(columns=["Unnamed: 0"])
  df = df.drop_duplicates()

  # combine duplicate reviews
  df = (
      df
      .groupby(["title", "taster_name"], as_index=False)
      .agg({
          "description": " ".join,
          **{
              col: "first"
              for col in df.columns
              if col not in ["title", "taster_name", "description"]
          }
      })
  )

  return df

def main():

    review_df = clean_wine_reviews("backend/data/winemag-data-130k-v2.csv")

    print("Cleaned dataset shape:", review_df.shape)

    review_df.to_csv("backend/data/cleaned_wine_reviews.csv", index=False)

    print("Cleaned dataset saved to backend/data/cleaned_wine_reviews.csv")


if __name__ == "__main__":
    main()