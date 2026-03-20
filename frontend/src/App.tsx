import { useState, useEffect } from 'react'
import './App.css'
import { WineResult } from './types'
import Chat from './Chat'

function App(): JSX.Element {
  const [useLlm, setUseLlm] = useState<boolean | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [results, setResults] = useState<WineResult[]>([])
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  const sampleMeals = ['Steak', 'Pizza', 'Pasta', 'Burger', 'Lobster']

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
      return
    }

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Search request failed')
      }

      const data: WineResult[] = await response.json()
      console.log('search data:', data)
      setResults(data)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
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
            <div id="answer-box">
              {results.map((wine, index) => (
                <article key={`${wine.title}-${index}`} className="result-card">
                  <div className="card-top-row">
                    <h2 className="wine-name">{wine.title}</h2>
                    {typeof wine.similarity === 'number' && (
                      <span className="match-badge">{(wine.similarity * 100).toFixed(1)}% Match</span>
                    )}
                  </div>

                  <p className="wine-subline">
                    <span>{wine.variety ?? 'Variety unavailable'}</span>
                    <span className="dot-separator" aria-hidden="true">•</span>
                    <span>{wine.winery ?? 'Winery unavailable'}</span>
                  </p>

                  <div className="meta-row">
                    <span className="meta-chip">Price: {wine.price != null ? `$${wine.price}` : 'N/A'}</span>
                    {wine.points != null && <span className="meta-chip">Points: {wine.points}</span>}
                    {wine.country && <span className="meta-chip">Country: {wine.country}</span>}
                  </div>

                  <p className="wine-description">
                    {wine.description ?? 'No description available.'}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {useLlm && (
          <section className="chat-section">
            <Chat onSearchTerm={handleSearch} />
          </section>
        )}
      </main>
    </div>
  )
}

export default App
