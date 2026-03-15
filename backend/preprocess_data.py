### This script preprocesses the wine-food pairing and wine review datasets, 
# normalizes the wine varieties, and merges them into a single dataset for
# use in the POURfect project. The resulting dataset is saved as a CSV file 
# for further analysis and model training.
### This script as created with the help of ChatGPT. In P02, we created a
# dataset-exploration.ipynb notebook file where we explored the datasets
# and cleaned the data as seen below. This script essentially is a translation
# of that notebook into a Python script that can be run to preprocess the data
# for the POURfect project.

import pandas as pd

def clean_food_wine_pairings(path):
  df = pd.read_csv(path)

  # keep only good pairings
  df = df[df["pairing_quality"] > 3]

  # combine cusines for duplicate wine/food pairs
  df = (
        df
        .groupby(["wine_type", "food_item"], as_index=False)
        .agg({
            "cuisine": list,
            **{
                col: "first"
                for col in df.columns
                if col not in ["wine_type", "food_item", "cuisine"]
            }
        })
    )

  return df

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

def normalize_varieties(food_df, review_df):

    food_varietals = set(food_df["wine_type"])

    review_df["normalized_variety"] = None

    for varietal2 in review_df["variety"].unique():

        matched = False

        for varietal1 in food_varietals:

            if varietal1 in varietal2:
                review_df.loc[
                    review_df["variety"] == varietal2,
                    "normalized_variety"
                ] = varietal1
                matched = True
                break

        if not matched:
            review_df.loc[
                review_df["variety"] == varietal2,
                "normalized_variety"
            ] = varietal2

    return review_df

def merge_datasets(food_df, review_df):

    merged_df = pd.merge(
        food_df,
        review_df,
        left_on="wine_type",
        right_on="normalized_variety",
        how="inner"
    )

    return merged_df

def main():

    food_df = clean_food_wine_pairings("data/wine_food_pairings.csv")

    review_df = clean_wine_reviews("data/winemag-data-130k-v2.csv")

    review_df = normalize_varieties(food_df, review_df)

    merged_df = merge_datasets(food_df, review_df)

    print("Merged dataset shape:", merged_df.shape)

    merged_df.to_csv("data/merged_POURfect_dataset.csv", index=False)

    print("Merged dataset saved to data/merged_POURfect_dataset.csv")


if __name__ == "__main__":
    main()