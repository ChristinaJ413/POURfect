import { useState, useEffect } from 'react'
import './App.css'
import SearchIcon from './assets/mag.png'
import { WineResult } from './types'
import Chat from './Chat'

function App(): JSX.Element {
  const [useLlm, setUseLlm] = useState<boolean | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [results, setResults] = useState<WineResult[]>([])

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(data => setUseLlm(data.use_llm))
  }, [])

  const handleSearch = async (value: string): Promise<void> => {
    setSearchTerm(value)
    if (value.trim() === '') { setResults([]); return }
    const response = await fetch(`/api/search?query=${encodeURIComponent(value)}`)
    const data: WineResult[] = await response.json()
    setResults(data)
  }

  if (useLlm === null) return <></>

  return (
    <div className={`full-body-container ${useLlm ? 'llm-mode' : ''}`}>
      {/* Search bar (always shown) */}
      <div className="top-text">
        <h1 className="app-title">POURfect</h1>
        <div className="input-box" onClick={() => document.getElementById('search-input')?.focus()}>
          <img src={SearchIcon} alt="search" />
          <input
            id="search-input"
            placeholder="Enter a dish, e.g. creamy mushroom risotto"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Search results (always shown) */}
      <div id="answer-box">
        {results.map((wine, index) => (
          <div key={index} className="episode-item">
            <h3 className="episode-title">{wine.title}</h3>

            <p className="episode-desc">
              <strong>Variety:</strong> {wine.variety ?? 'N/A'}
              &nbsp;|&nbsp;
              <strong>Winery:</strong> {wine.winery ?? 'N/A'}
            </p>

            <p className="episode-desc">
              <strong>Price:</strong> {wine.price != null ? `$${wine.price}` : 'N/A'}
            </p>

            {wine.points != null && (
              <p className="episode-desc">
                <strong>Points:</strong> {wine.points}
              </p>
            )}

            {wine.country && (
              <p className="episode-desc">
                <strong>Country:</strong> {wine.country}
              </p>
            )}

            <p className="episode-desc">
              <strong>Description:</strong> {wine.description ?? 'No description available.'}
            </p>

            {typeof wine.similarity === 'number' && (
              <p className="episode-rating">
                Similarity: {(wine.similarity * 100).toFixed(1)}%
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Chat (only when USE_LLM = True in routes.py) */}
      {useLlm && <Chat onSearchTerm={handleSearch} />}
    </div>
  )
}

export default App
