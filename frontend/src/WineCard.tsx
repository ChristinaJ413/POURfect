import LatentComparisonCharts from './LatentChart'
import { Comparison, WineResult } from './types'

interface WineCardProps {
  wine: WineResult
  comparison?: Comparison
  isTopMatch: boolean
  isExpanded: boolean
  onToggle: () => void
  isCompareSelected: boolean
  disableCompareSelect: boolean
  onCompareToggle: () => void
  onAskAboutWine: (wine: WineResult) => void
}

function WineCard({
  wine,
  comparison,
  isTopMatch,
  isExpanded,
  onToggle,
  isCompareSelected,
  disableCompareSelect,
  onCompareToggle,
  onAskAboutWine,
}: WineCardProps): JSX.Element {
  const validPrice = typeof wine.price === 'number' && Number.isFinite(wine.price)
  const validPoints = typeof wine.points === 'number' && Number.isFinite(wine.points)

  return (
    <article className={`result-card ${isTopMatch ? 'top-match-card' : ''}`}>
      <div className="card-top-row">
        <h2 className="wine-name">{wine.title}</h2>
        {typeof wine.similarity === 'number' && (
          <div className="match-badge-container">
            <span className="match-badge">
              {(wine.similarity * 100).toFixed(1)}% Match
            </span>
            {isTopMatch && <span className="best-match-list-badge">Best Match</span>}
          </div>
        )}
      </div>

      <p className="wine-subline">
        <span>{wine.variety ?? 'Variety unavailable'}</span>
        <span className="dot-separator">•</span>
        <span>{wine.winery ?? 'Winery unavailable'}</span>
      </p>

      <div className="meta-row">
        <span className="meta-chip">
          Price: {validPrice ? `$${wine.price}` : 'N/A'}
        </span>
        {validPoints && <span className="meta-chip">Points: {wine.points}</span>}
        {wine.country && <span className="meta-chip">Country: {wine.country}</span>}
      </div>

      <p className="wine-description">{wine.description ?? 'No description available.'}</p>

      <div className="card-actions">
        <div className="ask-ai-wrapper">
          <span className="ask-ai-label">Ask AI</span>
          <button
            type="button"
            className="ask-chat-pill"
            onClick={() => onAskAboutWine(wine)}
          >
            Why this wine?
          </button>
        </div>
      </div>

      <div className="compare-toggle-row">
        <label className={`compare-toggle ${isCompareSelected ? 'selected' : ''} ${disableCompareSelect ? 'disabled' : ''}`}>
          <input
            type="checkbox"
            checked={isCompareSelected}
            onChange={onCompareToggle}
            disabled={disableCompareSelect}
          />
          <span className="compare-toggle-track" aria-hidden="true">
            <span className="compare-toggle-thumb" />
          </span>
          <span className="compare-toggle-text">
            {isCompareSelected ? '✓ Comparing' : 'Select to compare'}
          </span>
        </label>
      </div>

      {comparison && (
        <button type="button" className="explanation-toggle" onClick={onToggle}>
          {isExpanded ? 'Close explanation' : 'Open explanation'}
        </button>
      )}

      {comparison && (
        <>
          {isExpanded && (
            <div className="chart-wrapper">
              <LatentComparisonCharts comparisons={[comparison]} />
            </div>
          )}
        </>
      )}
    </article>
  )
}

export default WineCard
