export interface WineResult {
  title: string
  variety: string | null
  winery: string | null
  price: number | null
  points?: number | null
  country?: string | null
  description: string | null
  similarity?: number
}

export interface DimensionDatum {
  dimension: number
  label: string
  query_value: number
  wine_value: number
}

export interface Comparison {
  result_index: number
  title: string
  similarity: number
  dimensions: DimensionDatum[]
}