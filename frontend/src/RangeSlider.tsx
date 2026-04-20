/**
 * Dual-thumb range on one visual track (two overlapping native range inputs).
 */

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  low: number
  high: number
  disabled?: boolean
  onChange: (low: number, high: number) => void
}

function RangeSlider({
  min,
  max,
  step = 1,
  low,
  high,
  disabled = false,
  onChange,
}: RangeSliderProps): JSX.Element {
  const span = max > min ? max - min : 1
  const fillLeft = ((low - min) / span) * 100
  const fillWidth = max > min ? ((high - low) / span) * 100 : 100

  return (
    <div className={`range-slider-single ${disabled ? 'disabled' : ''}`}>
      <div className="range-slider-track" aria-hidden="true">
        <div
          className="range-slider-fill"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
      </div>
      <input
        type="range"
        className="range-slider-input range-slider-input-lower"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={low}
        onChange={(e) => {
          const v = Number(e.target.value)
          onChange(Math.min(v, high), high)
        }}
      />
      <input
        type="range"
        className="range-slider-input range-slider-input-upper"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={high}
        onChange={(e) => {
          const v = Number(e.target.value)
          onChange(low, Math.max(v, low))
        }}
      />
    </div>
  )
}

export default RangeSlider
