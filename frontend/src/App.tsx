import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Comparison, WineResult } from './types'
import Chat from './Chat'
import FilterBar, { DEFAULT_FILTERS, FilterValues } from './FilterBar'
import LatentComparisonCharts from './LatentChart'
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

  const [isChatOpen, setIsChatOpen] = useState<boolean>(true)
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([])
  const [noStrongMatches, setNoStrongMatches] = useState<boolean>(false)

  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(null)

  const sampleMeals = ['Steak', 'Pizza', 'Pasta', 'Burger', 'Lobster']
  const [openExplanationIds, setOpenExplanationIds] = useState<Set<string>>(new Set())
  const [compareSelection, setCompareSelection] = useState<number[]>([])
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false)
  const [compareLimitMessage, setCompareLimitMessage] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS)
  const comparisonPanelRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => setUseLlm(data.use_llm))
  }, [])

  const handleSearch = async (value: string): Promise<void> => {
    setFilters(DEFAULT_FILTERS)
    const query = value.trim()
    setSearchTerm(value)
    setHasSearched(query.length > 0)

    if (query === '') {
      setResults([])
      setComparisons([])
      setSuggestedQueries([])
      setNoStrongMatches(false)
      setCompareSelection([])
      setIsCompareOpen(false)
      setCompareLimitMessage('')
      setCurrentPage(1)
      setOpenExplanationIds(new Set())
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
      setNoStrongMatches(data.no_strong_matches === true)
      setCompareSelection([])
      setIsCompareOpen(false)
      setCompareLimitMessage('')
      setCurrentPage(1)
      setOpenExplanationIds(new Set())
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setComparisons([])
      setSuggestedQueries([])
      setNoStrongMatches(false)
      setCompareSelection([])
      setIsCompareOpen(false)
      setCompareLimitMessage('')
      setCurrentPage(1)
      setOpenExplanationIds(new Set())
    }
  }

  const [selectedWine, setSelectedWine] = useState<WineResult | null>(null)

  const handleAskAboutWine = (wine: WineResult): void => {
    const message = `Why is "${wine.title}" a good match for ${searchTerm}? Include tasting notes and pairing details.`

    setSelectedWine(wine)
    setIsChatOpen(true)
    setPendingChatMessage(message)
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
    setOpenExplanationIds(new Set())
  }, [filters])
  const toggleExplanation = (cardId: string): void => {
    setOpenExplanationIds((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }


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
  const maxVisibleMatch = visibleResults.reduce((max, { wine }) => {
    if (typeof wine.similarity !== 'number' || !Number.isFinite(wine.similarity)) return max
    return Math.max(max, wine.similarity)
  }, Number.NEGATIVE_INFINITY)
  const selectedComparisonWines = compareSelection
    .map((idx) => ({ index: idx, wine: results[idx] }))
    .filter((entry): entry is { index: number, wine: WineResult } => Boolean(entry.wine))
  const selectedComparisonEntries = selectedComparisonWines
    .map((entry) => ({
      ...entry,
      comparison: comparisons[entry.index],
    }))
    .filter((entry): entry is { index: number, wine: WineResult, comparison: Comparison } => Boolean(entry.comparison))
  const canCompare = selectedComparisonWines.length === 2
  const firstSimilarity = selectedComparisonWines[0]?.wine.similarity ?? Number.NEGATIVE_INFINITY
  const secondSimilarity = selectedComparisonWines[1]?.wine.similarity ?? Number.NEGATIVE_INFINITY
  const bestMatchIndex = canCompare
    ? (firstSimilarity >= secondSimilarity ? 0 : 1)
    : null
  const bestMatchWine = bestMatchIndex !== null ? selectedComparisonWines[bestMatchIndex].wine : null
  const bestSimilarity = results[0]?.similarity ?? 0
  const showWeakMatchWarning =
    hasSearched
    && (noStrongMatches || (results.length > 0 && bestSimilarity < WEAK_MATCH_THRESHOLD))

  const toggleCompareSelection = (originalIndex: number): void => {
    const isSelected = compareSelection.includes(originalIndex)
    if (isSelected) {
      setCompareSelection(compareSelection.filter((idx) => idx !== originalIndex))
      setCompareLimitMessage('')
      return
    }
    if (compareSelection.length >= 2) {
      setCompareLimitMessage('You can compare up to 2 wines.')
      return
    }
    setCompareSelection([...compareSelection, originalIndex])
    setCompareLimitMessage('')
  }

  const formatPrice = (value: number | null | undefined): string => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A'
    return `$${value}`
  }

  const formatPoints = (value: number | null | undefined): string => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A'
    return `${Math.round(value)}`
  }

  const formatSimilarity = (value: number | null | undefined): string => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A'
    return `${(value * 100).toFixed(1)}%`
  }

  useEffect(() => {
    if (isCompareOpen && canCompare && comparisonPanelRef.current) {
      comparisonPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [isCompareOpen, canCompare])

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
            <div className="suggestions-block">
              <span className="suggestion-label">AI Suggested queries</span>
              <div
                className="suggestion-chips"
                role="group"
                aria-label="AI-suggested search queries"
              >
                {suggestedQueries.map((q, idx) => (
                  <button
                    key={`${q}-${idx}`}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => onSuggestionClick(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasSearched && (
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
          )}
        </section>

        {!hasSearched && (
          <section className="empty-state">
            <p className="empty-heading">Start with a food or meal search</p>
            <p className="empty-copy">
              Enter a dish and POURfect will return wine matches ranked by similarity and pairing relevance.
            </p>
            <p className="empty-note">Tip: check out the chatbot to learn more about the wines.</p>
          </section>
        )}

        {hasSearched && (
          <section className="results-section" aria-live="polite">
            <div className="results-divider" />
            {results.length > 0 && (
              <FilterBar
                values={filters}
                countries={countryOptions}
                varieties={varietyOptions}
                priceBounds={priceBounds}
                pointsBounds={pointsBounds}
                onChange={setFilters}
              />
            )}

            {showWeakMatchWarning && (
              <WarningBanner message="No strong matches found for your search. Try a suggested query or a simpler meal name." />
            )}

            {results.length > 0 && (
              <section className="compare-toolbar" aria-label="Wine comparison controls">
                <div className="compare-count">
                  Selected for comparison: {selectedComparisonWines.length}/2
                </div>
                <div className="compare-toolbar-actions">
                  <button
                    type="button"
                    className="compare-wines-button"
                    disabled={!canCompare}
                    onClick={() => setIsCompareOpen(true)}
                  >
                    Compare Wines
                  </button>
                  {selectedComparisonWines.length > 0 && (
                    <button
                      type="button"
                      className="clear-compare-button"
                      onClick={() => {
                        setCompareSelection([])
                        setIsCompareOpen(false)
                        setCompareLimitMessage('')
                      }}
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              </section>
            )}

            {compareLimitMessage && (
              <WarningBanner message={compareLimitMessage} />
            )}

            {isCompareOpen && canCompare && (
              <section
                ref={comparisonPanelRef}
                className="comparison-panel"
                aria-label="Side-by-side wine comparison"
              >
                <div className="comparison-panel-header">
                  <h3>Wine Comparison</h3>
                  <button
                    type="button"
                    className="comparison-close-button"
                    onClick={() => setIsCompareOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="comparison-header-divider" />
                {bestMatchWine && (
                  <p className="comparison-summary">
                    Best Match: {bestMatchWine.title} ({formatSimilarity(bestMatchWine.similarity)})
                  </p>
                )}
                {bestMatchWine && (
                  <p className="comparison-reason">
                    {bestMatchWine.title} is a better match based on its higher similarity score.
                  </p>
                )}

                <div className="comparison-grid">
                  <article className={`comparison-card ${bestMatchIndex === 0 ? 'best-match-card' : ''}`}>
                    <h4>{selectedComparisonWines[0].wine.title}</h4>
                    {bestMatchIndex === 0 && <span className="best-match-badge">Best Match</span>}
                    <dl className="comparison-list">
                      <div><dt>Variety</dt><dd>{selectedComparisonWines[0].wine.variety ?? 'N/A'}</dd></div>
                      <div><dt>Winery</dt><dd>{selectedComparisonWines[0].wine.winery ?? 'N/A'}</dd></div>
                      <div><dt>Country</dt><dd>{selectedComparisonWines[0].wine.country ?? 'N/A'}</dd></div>
                      <div><dt>Price</dt><dd>{formatPrice(selectedComparisonWines[0].wine.price)}</dd></div>
                      <div><dt>Points</dt><dd>{formatPoints(selectedComparisonWines[0].wine.points)}</dd></div>
                      <div><dt>Match</dt><dd>{formatSimilarity(selectedComparisonWines[0].wine.similarity)}</dd></div>
                      <div><dt>Description</dt><dd>{selectedComparisonWines[0].wine.description ?? 'No description available.'}</dd></div>
                    </dl>
                    {selectedComparisonEntries[0] && (
                      <div className="comparison-chart-wrap">
                        <LatentComparisonCharts
                          comparisons={[selectedComparisonEntries[0].comparison]}
                          isComparisonView
                        />
                      </div>
                    )}
                  </article>
                  <article className={`comparison-card ${bestMatchIndex === 1 ? 'best-match-card' : ''}`}>
                    <h4>{selectedComparisonWines[1].wine.title}</h4>
                    {bestMatchIndex === 1 && <span className="best-match-badge">Best Match</span>}
                    <dl className="comparison-list">
                      <div><dt>Variety</dt><dd>{selectedComparisonWines[1].wine.variety ?? 'N/A'}</dd></div>
                      <div><dt>Winery</dt><dd>{selectedComparisonWines[1].wine.winery ?? 'N/A'}</dd></div>
                      <div><dt>Country</dt><dd>{selectedComparisonWines[1].wine.country ?? 'N/A'}</dd></div>
                      <div><dt>Price</dt><dd>{formatPrice(selectedComparisonWines[1].wine.price)}</dd></div>
                      <div><dt>Points</dt><dd>{formatPoints(selectedComparisonWines[1].wine.points)}</dd></div>
                      <div><dt>Match</dt><dd>{formatSimilarity(selectedComparisonWines[1].wine.similarity)}</dd></div>
                      <div><dt>Description</dt><dd>{selectedComparisonWines[1].wine.description ?? 'No description available.'}</dd></div>
                    </dl>
                    {selectedComparisonEntries[1] && (
                      <div className="comparison-chart-wrap">
                        <LatentComparisonCharts
                          comparisons={[selectedComparisonEntries[1].comparison]}
                          isComparisonView
                        />
                      </div>
                    )}
                  </article>
                </div>
              </section>
            )}

            {results.length === 0 ? (
              noStrongMatches ? null : (
                <div className="results-message">No wines were found for this search.</div>
              )
            ) : filteredResults.length === 0 ? (
              <WarningBanner message="No results match your current filters." />
            ) : (
              <>
                <div
                  id="answer-box"
                  className={openExplanationIds.size > 0 ? 'answer-box--explanation-open' : undefined}
                >
                  {visibleResults.map(({ wine, originalIndex }) => {
                    const cardId = `${wine.title}-${originalIndex}`
                    return (
                      <WineCard
                        key={cardId}
                        wine={wine}
                        comparison={comparisons[originalIndex]}
                        isTopMatch={
                          typeof wine.similarity === 'number'
                          && Number.isFinite(wine.similarity)
                          && wine.similarity === maxVisibleMatch
                        }
                        isExpanded={openExplanationIds.has(cardId)}
                        onToggle={() => toggleExplanation(cardId)}
                        isCompareSelected={compareSelection.includes(originalIndex)}
                        disableCompareSelect={compareSelection.length >= 2 && !compareSelection.includes(originalIndex)}
                        onCompareToggle={() => toggleCompareSelection(originalIndex)}
                        onAskAboutWine={handleAskAboutWine}
                      />
                    )
                  })}
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
                  <h2>POURfect Wine Assistant</h2>
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
                    pendingMessage={pendingChatMessage}
                    clearPendingMessage={() => setPendingChatMessage(null)}
                    selectedWine={selectedWine}
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
