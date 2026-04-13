import LatentComparisonCharts from './LatentChart'
import { Comparison, WineResult } from './types'

interface WineCardProps {
  wine: WineResult
  comparison?: Comparison
  isExpanded: boolean
  onToggle: () => void
}

function WineCard({ wine, comparison, isExpanded, onToggle }: WineCardProps): JSX.Element {
  const validPrice = typeof wine.price === 'number' && Number.isFinite(wine.price)
  const validPoints = typeof wine.points === 'number' && Number.isFinite(wine.points)

  return (
    <article className="result-card">
      <div className="card-top-row">
        <h2 className="wine-name">{wine.title}</h2>
        {typeof wine.similarity === 'number' && (
          <span className="match-badge">{(wine.similarity * 100).toFixed(1)}% Match</span>
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

      {comparison && (
        <>
          <button type="button" className="explanation-toggle" onClick={onToggle}>
            {isExpanded ? 'Close explanation' : 'Open explanation'}
          </button>
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
