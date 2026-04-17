import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { Comparison, WineResult } from './types'
import Chat from './Chat'
import FilterBar, { FilterValues } from './FilterBar'
import PaginationControls from './PaginationControls'
import WarningBanner from './WarningBanner'
import WineCard from './WineCard'

const RESULTS_PER_PAGE = 6
const WEAK_MATCH_THRESHOLD = 0.15

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function App(): JSX.Element {
  const [useLlm, setUseLlm] = useState<boolean | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [results, setResults] = useState<WineResult[]>([])
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [hasSearched, setHasSearched] = useState<boolean>(false)

  const [isChatOpen, setIsChatOpen] = useState<boolean>(false)
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([])

  const sampleMeals = ['Steak', 'Pizza', 'Pasta', 'Burger', 'Lobster']
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [filters, setFilters] = useState<FilterValues>({
    priceMin: '',
    priceMax: '',
    pointsMin: '',
    pointsMax: '',
    country: 'All',
    variety: 'All',
  })

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => setUseLlm(data.use_llm))
  }, [])

  const handleSearch = async (value: string): Promise<void> => {
    const query = value.trim()
    setSearchTerm(value)
    setHasSearched(query.length > 0)

    if (query === '') {
      setResults([])
      setComparisons([])
      setSuggestedQueries([])
      setCurrentPage(1)
      setSelectedIndex(null)
      return
    }

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Search request failed')
      }

      const data = await response.json()
      setResults(data.results || [])
      setComparisons(data.comparisons || [])
      setSuggestedQueries(data.suggested_queries || [])
      setCurrentPage(1)
      setSelectedIndex(null)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setComparisons([])
      setSuggestedQueries([])
      setCurrentPage(1)
      setSelectedIndex(null)
    }
  }

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    void handleSearch(searchTerm)
  }

  const onChipClick = (meal: string): void => {
    setSearchTerm(meal)
    void handleSearch(meal)
  }

  const onSuggestionClick = (query: string): void => {
    setSearchTerm(query)
    void handleSearch(query)
  }

  const countryOptions = useMemo(() => {
    return Array.from(new Set(results.map((wine) => wine.country).filter(Boolean) as string[]))
      .sort((a, b) => a.localeCompare(b))
  }, [results])

  const varietyOptions = useMemo(() => {
    return Array.from(new Set(results.map((wine) => wine.variety).filter(Boolean) as string[]))
      .sort((a, b) => a.localeCompare(b))
  }, [results])

  const priceBounds = useMemo(() => {
    const prices = results
      .map((wine) => toFiniteNumber(wine.price))
      .filter((price): price is number => price !== null)

    if (prices.length === 0) return null
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    }
  }, [results])

  const pointsBounds = useMemo(() => {
    const points = results
      .map((wine) => toFiniteNumber(wine.points))
      .filter((point): point is number => point !== null)

    if (points.length === 0) return null
    return {
      min: Math.floor(Math.min(...points)),
      max: Math.ceil(Math.max(...points)),
    }
  }, [results])

  const filteredResults = useMemo(() => {
    const priceMin = filters.priceMin === '' ? null : Number(filters.priceMin)
    const priceMax = filters.priceMax === '' ? null : Number(filters.priceMax)
    const pointsMin = filters.pointsMin === '' ? null : Number(filters.pointsMin)
    const pointsMax = filters.pointsMax === '' ? null : Number(filters.pointsMax)

    const priceFilterActive = priceBounds
      ? ((priceMin !== null || priceMax !== null)
        && !(priceMin === priceBounds.min && priceMax === priceBounds.max))
      : false
    const pointsFilterActive = pointsBounds
      ? ((pointsMin !== null || pointsMax !== null)
        && !(pointsMin === pointsBounds.min && pointsMax === pointsBounds.max))
      : false

    return results
      .map((wine, originalIndex) => ({ wine, originalIndex }))
      .filter(({ wine }) => {
        const priceValue = toFiniteNumber(wine.price)
        const pointsValue = toFiniteNumber(wine.points)

        if (priceFilterActive) {
          if (priceValue === null) return false
          if (priceMin !== null && priceValue < priceMin) return false
          if (priceMax !== null && priceValue > priceMax) return false
        }
        if (pointsFilterActive) {
          if (pointsValue === null) return false
          if (pointsMin !== null && pointsValue < pointsMin) return false
          if (pointsMax !== null && pointsValue > pointsMax) return false
        }
        if (filters.country !== 'All' && wine.country !== filters.country) return false
        if (filters.variety !== 'All' && wine.variety !== filters.variety) return false
        return true
      })
  }, [results, filters, priceBounds, pointsBounds])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedIndex(null)
  }, [filters])

  useEffect(() => {
    setFilters((prev) => {
      let nextMaxPrice = prev.priceMax
      let nextMinPrice = prev.priceMin
      let nextMaxPoints = prev.pointsMax
      let nextMinPoints = prev.pointsMin

      if (!priceBounds) {
        nextMinPrice = ''
        nextMaxPrice = ''
      } else {
        if (nextMinPrice !== '') {
          const clampedMin = Math.min(priceBounds.max, Math.max(priceBounds.min, Number(nextMinPrice)))
          nextMinPrice = String(clampedMin)
        }
        if (nextMaxPrice !== '') {
          const clampedMax = Math.min(priceBounds.max, Math.max(priceBounds.min, Number(nextMaxPrice)))
          nextMaxPrice = String(clampedMax)
        }
        if (nextMinPrice !== '' && nextMaxPrice !== '' && Number(nextMinPrice) > Number(nextMaxPrice)) {
          nextMinPrice = nextMaxPrice
        }
      }

      if (!pointsBounds) {
        nextMaxPoints = ''
        nextMinPoints = ''
      } else {
        if (nextMinPoints !== '') {
          const clampedMin = Math.min(pointsBounds.max, Math.max(pointsBounds.min, Number(nextMinPoints)))
          nextMinPoints = String(clampedMin)
        }
        if (nextMaxPoints !== '') {
          const clampedMax = Math.min(pointsBounds.max, Math.max(pointsBounds.min, Number(nextMaxPoints)))
          nextMaxPoints = String(clampedMax)
        }
        if (nextMinPoints !== '' && nextMaxPoints !== '' && Number(nextMinPoints) > Number(nextMaxPoints)) {
          nextMinPoints = nextMaxPoints
        }
      }

      if (
        nextMinPrice === prev.priceMin
        && nextMaxPrice === prev.priceMax
        && nextMinPoints === prev.pointsMin
        && nextMaxPoints === prev.pointsMax
      ) return prev
      return {
        ...prev,
        priceMin: nextMinPrice,
        priceMax: nextMaxPrice,
        pointsMin: nextMinPoints,
        pointsMax: nextMaxPoints,
      }
    })
  }, [priceBounds, pointsBounds])

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PER_PAGE))
  const pageStart = (currentPage - 1) * RESULTS_PER_PAGE
  const visibleResults = filteredResults.slice(pageStart, pageStart + RESULTS_PER_PAGE)
  const bestSimilarity = results[0]?.similarity ?? 0
  const showWeakMatchWarning = hasSearched && results.length > 0 && bestSimilarity < WEAK_MATCH_THRESHOLD

  if (useLlm === null) return <></>

  return (
    <div className={`full-body-container ${useLlm ? 'llm-mode' : ''}`}>
      <div className="background-accent accent-one" aria-hidden="true" />
      <div className="background-accent accent-two" aria-hidden="true" />

      <main className="page-shell">
        <section className="hero-section">
          <h1 className="app-title">
            POURfect <span className="title-accent" aria-hidden="true">🍷</span>
          </h1>
          <p className="hero-subtitle">Find the perfect wine pairing for your meal</p>

          <form className="search-form" onSubmit={onSearchSubmit}>
            <input
              id="search-input"
              className="search-input"
              placeholder="Enter a dish, e.g. pizza, steak, lobster"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="search-button">Search</button>
          </form>

          {suggestedQueries.length > 0 && hasSearched && (
            <div className="suggestions-row">
              <span className='suggestion-label'>Suggested queries:</span>
              {suggestedQueries.map((q, idx) => (
                <button
                  key={`${q}-${idx}`}
                  type="button"
                  className="suggestion-link"
                  onClick={() => onSuggestionClick(q)}
                >
                  {q}
                </button>
              ))}
            </div>)}

          <div className="chip-row" aria-label="Example meal searches">
            {sampleMeals.map((meal) => (
              <button
                key={meal}
                type="button"
                className="meal-chip"
                onClick={() => onChipClick(meal)}
              >
                {meal}
              </button>
            ))}
          </div>
        </section>

        {!hasSearched && (
          <section className="empty-state">
            <p className="empty-heading">Start with a simple meal search</p>
            <p className="empty-copy">
              Enter a dish and POURfect will return wine matches ranked by similarity and pairing relevance.
            </p>
            <p className="empty-note">Tip: best results usually come from simple meal names.</p>
          </section>
        )}

        {hasSearched && (
          <section className="results-section" aria-live="polite">
            <div className="results-divider" />
            <FilterBar
              values={filters}
              countries={countryOptions}
              varieties={varietyOptions}
              priceBounds={priceBounds}
              pointsBounds={pointsBounds}
              onChange={setFilters}
            />

            {showWeakMatchWarning && (
              <WarningBanner message="No strong matches found for your search. Showing the closest available results." />
            )}

            {results.length === 0 ? (
              <div className="results-message">No wines were found for this search.</div>
            ) : filteredResults.length === 0 ? (
              <div className="results-message">No results match your current filters.</div>
            ) : (
              <>
                <div id="answer-box">
                  {visibleResults.map(({ wine, originalIndex }) => (
                    <WineCard
                      key={`${wine.title}-${originalIndex}`}
                      wine={wine}
                      comparison={comparisons[originalIndex]}
                      isExpanded={selectedIndex === originalIndex}
                      onToggle={() => setSelectedIndex(selectedIndex === originalIndex ? null : originalIndex)}
                    />
                  ))}
                </div>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  onNext={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                />
              </>
            )}
          </section>
        )}

        {useLlm && (
          <>
            <button
              type="button"
              className="chat-fab"
              onClick={() => setIsChatOpen((prev) => !prev)}
              aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
            >
              {isChatOpen ? '×' : 'Chat'}
            </button>

            {isChatOpen && (
              <section className="chat-popup">
                <div className="chat-popup-header">
                  <h2>POURfect Assistant</h2>
                  <button
                    type="button"
                    className="chat-close-button"
                    onClick={() => setIsChatOpen(false)}
                    aria-label="Close chat"
                  >
                    ×
                  </button>
                </div>

                <div className="chat-popup-body">
                  <Chat
                    onSearchTerm={handleSearch}
                    currentSearchTerm={searchTerm}
                    currentResults={results}
                  />
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
