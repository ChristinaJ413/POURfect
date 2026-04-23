import {
  Dot,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDecimal } from './formatDecimal'

type DimensionDatum = {
  dimension: number;
  label: string;
  query_value: number;
  wine_value: number;
};

type Comparison = {
  result_index: number;
  title: string;
  similarity: number;
  dimensions: DimensionDatum[];
};

type Props = {
  comparisons: Comparison[]
  isComparisonView?: boolean
  compact?: boolean
  sharedDimensionOrder?: number[]
}

const MAX_DIMENSIONS = 10
const MIN_VISIBLE_RADIUS = 0.2
const RING_LEVELS = [0.2, 0.4, 0.6, 0.8, 1]

const formatDimensionName = (rawLabel: string, dimension: number): string => {
  const cleaned = rawLabel
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')
  return cleaned || `Dimension ${dimension}`
}

export default function LatentComparisonCharts({
  comparisons,
  isComparisonView = false,
  compact = false,
  sharedDimensionOrder,
}: Props) {
  if (!comparisons || comparisons.length === 0) return null

  const isWineComparisonPanelChart = Boolean(isComparisonView && compact)

  const projectToVisibleRadius = (value: number, minValue: number, range: number): number => {
    const normalized = (value - minValue) / range
    return MIN_VISIBLE_RADIUS + normalized * (1 - MIN_VISIBLE_RADIUS)
  }

  const renderComparisonTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]?.payload) return null
    const point = payload[0].payload
    return (
      <div className="latent-tooltip">
        <div className="latent-tooltip-title">{label}</div>
        <div>Query: {formatDecimal(Number(point.query ?? 0))}</div>
        <div>Wine: {formatDecimal(Number(point.wine ?? 0))}</div>
      </div>
    )
  }

  return (
    <div className={`latent-chart-root ${compact ? 'latent-chart-root--compact' : ''}`}>
      {!isComparisonView && (
        <>
          <h2>Why This Wine Was Chosen</h2>
          <p className="latent-chart-intro">
            This radar compares the query and wine across the strongest latent dimensions.
          </p>
        </>
      )}

      {comparisons.map((comp, idx) => {
        const orderedDimensions = sharedDimensionOrder
          ? sharedDimensionOrder
            .map((dimensionId) => comp.dimensions.find((d) => d.dimension === dimensionId))
            .filter((d): d is DimensionDatum => Boolean(d))
          : comp.dimensions
        const topDimensions = orderedDimensions.slice(0, MAX_DIMENSIONS)

        const rawData = topDimensions.map((d) => {
          const fullLabel = formatDimensionName(d.label, d.dimension)
          return {
            fullLabel,
            shortLabel: fullLabel,
            query: d.query_value,
            wine: d.wine_value,
            alignmentGapRaw: Math.abs(d.query_value - d.wine_value),
          }
        })

        const flattened = rawData.flatMap((d) => [d.query, d.wine])
        const minValue = Math.min(...flattened)
        const maxValue = Math.max(...flattened)
        const range = Math.max(1e-6, maxValue - minValue)
        const chartData = rawData.map((d) => ({
          ...d,
          queryNorm: projectToVisibleRadius(d.query, minValue, range),
          wineNorm: projectToVisibleRadius(d.wine, minValue, range),
        }))
        const strongestAlignment = [...chartData]
          .sort((a, b) => a.alignmentGapRaw - b.alignmentGapRaw)
          [0]
        const weakestAlignment = [...chartData]
          .sort((a, b) => b.alignmentGapRaw - a.alignmentGapRaw)[0]

        return (
          <div key={idx} className="latent-comparison-panel">
            <div className="latent-comparison-header">
              <h3 className="latent-comparison-title">{comp.title}</h3>
              <div className="latent-comparison-subheader">
                <p className="latent-comparison-score">Similarity Score: {comp.similarity.toFixed(3)}</p>
                <div className="latent-legend" aria-label="Chart legend">
                  <span className="latent-legend-item latent-legend-item--wine">
                    <span className="latent-legend-swatch" style={{ backgroundColor: '#8F2D3A' }} />
                    Wine
                  </span>
                  <span className="latent-legend-item latent-legend-item--query">
                    <span className="latent-legend-swatch" style={{ backgroundColor: '#6F5ACD' }} />
                    Query
                  </span>
                </div>
              </div>
            </div>

            <div className={`latent-chart-container ${compact ? 'latent-chart-container--compact' : ''}`}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={chartData}
                  outerRadius={
                    isWineComparisonPanelChart ? '82%' : compact ? '67%' : '73%'
                  }
                  margin={
                    isWineComparisonPanelChart
                      ? { top: 26, right: 82, bottom: 22, left: 82 }
                      : { top: 34, right: 96, bottom: 30, left: 96 }
                  }
                >
                  <PolarGrid
                    gridType="polygon"
                    radialLines
                    stroke="rgba(100, 13, 20, 0.36)"
                    strokeWidth={1}
                  />
                  <PolarAngleAxis
                    dataKey="shortLabel"
                    tick={({ payload, x, y, textAnchor }) => (
                      (() => {
                        const fullLabel = String((payload as { payload?: { fullLabel?: string } })?.payload?.fullLabel ?? '')
                        const shortLabel = String((payload as { value?: string })?.value ?? '')
                        return (
                      <text
                        x={x}
                        y={y}
                        textAnchor={textAnchor}
                        fill="#4d4d4d"
                        fontSize={compact ? 11 : 12}
                        fontWeight={500}
                      >
                        <title>{fullLabel}</title>
                        {shortLabel}
                      </text>
                        )
                      })()
                    )}
                  />
                  <PolarRadiusAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[MIN_VISIBLE_RADIUS, 1]}
                    ticks={RING_LEVELS}
                    tick={false}
                  />
                  <Tooltip
                    content={renderComparisonTooltip}
                    labelFormatter={(_, payload) => String(payload?.[0]?.payload?.fullLabel ?? '')}
                  />
                  <Radar
                    dataKey="queryNorm"
                    name="Query"
                    stroke="#6F5ACD"
                    strokeOpacity={0.55}
                    fill="#6F5ACD"
                    fillOpacity={0.08}
                    strokeWidth={2}
                    dot={({ cx, cy }) => (
                      <Dot cx={cx} cy={cy} r={2.8} fill="#6F5ACD" fillOpacity={0.65} strokeWidth={0} />
                    )}
                  />
                  <Radar
                    dataKey="wineNorm"
                    name="Wine"
                    stroke="#8F2D3A"
                    fill="#8F2D3A"
                    fillOpacity={0.12}
                    strokeWidth={3}
                    dot={({ cx, cy }) => (
                      <Dot
                        cx={cx}
                        cy={cy}
                        r={4.2}
                        fill="#8F2D3A"
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                    )}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="latent-chart-summary">
              <p>Strongest Alignment: {strongestAlignment?.fullLabel ?? 'N/A'}</p>
              <p>Weakest Alignment: {weakestAlignment?.fullLabel ?? 'N/A'}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}