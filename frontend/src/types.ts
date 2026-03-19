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