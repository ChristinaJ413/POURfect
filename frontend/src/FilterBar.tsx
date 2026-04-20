import RangeSlider from './RangeSlider'

export interface FilterValues {
  priceMin: string
  priceMax: string
  pointsMin: string
  pointsMax: string
  country: string
  variety: string
}

export const DEFAULT_FILTERS: FilterValues = {
  priceMin: '',
  priceMax: '',
  pointsMin: '',
  pointsMax: '',
  country: 'All',
  variety: 'All',
}

interface FilterBarProps {
  values: FilterValues
  countries: string[]
  varieties: string[]
  priceBounds: { min: number; max: number } | null
  pointsBounds: { min: number; max: number } | null
  onChange: (next: FilterValues) => void
}

function FilterBar({
  values,
  countries,
  varieties,
  priceBounds,
  pointsBounds,
  onChange,
}: FilterBarProps): JSX.Element {
  const updateField = (field: keyof FilterValues, value: string): void => {
    onChange({ ...values, [field]: value })
  }
  const setPriceAny = (): void => {
    onChange({ ...values, priceMin: '', priceMax: '' })
  }
  const setPointsAny = (): void => {
    onChange({ ...values, pointsMin: '', pointsMax: '' })
  }

  const sliderMaxPrice = priceBounds
    ? Number(values.priceMax || priceBounds.max)
    : 0
  const sliderMinPrice = priceBounds
    ? Number(values.priceMin || priceBounds.min)
    : 0
  const sliderMinPoints = pointsBounds
    ? Number(values.pointsMin || pointsBounds.min)
    : 0
  const sliderMaxPoints = pointsBounds
    ? Number(values.pointsMax || pointsBounds.max)
    : 0

  const priceIsAny = !priceBounds
    || (values.priceMin === '' && values.priceMax === '')
    || (sliderMinPrice <= priceBounds.min && sliderMaxPrice >= priceBounds.max)
  const pointsIsAny = !pointsBounds
    || (values.pointsMin === '' && values.pointsMax === '')
    || (sliderMinPoints <= pointsBounds.min && sliderMaxPoints >= pointsBounds.max)

  return (
    <div className="filter-bar" aria-label="Search filters">
      <div className="filter-field">
        <div className="filter-heading">
          <span>Price</span>
          <button
            type="button"
            className={`filter-any-toggle ${priceIsAny ? 'active' : ''}`}
            onClick={setPriceAny}
            disabled={!priceBounds}
          >
            Any
          </button>
        </div>
        <div className="range-value">
          {priceIsAny ? 'Any' : `$${sliderMinPrice} - $${sliderMaxPrice}`}
        </div>
        {priceBounds && (
          <RangeSlider
            min={priceBounds.min}
            max={priceBounds.max}
            step={1}
            low={sliderMinPrice}
            high={sliderMaxPrice}
            disabled={!priceBounds}
            onChange={(low, high) => {
              onChange({
                ...values,
                priceMin: String(low),
                priceMax: String(high),
              })
            }}
          />
        )}
      </div>

      <div className="filter-field">
        <div className="filter-heading">
          <span>Points</span>
          <button
            type="button"
            className={`filter-any-toggle ${pointsIsAny ? 'active' : ''}`}
            onClick={setPointsAny}
            disabled={!pointsBounds}
          >
            Any
          </button>
        </div>
        <div className="range-value">
          {pointsIsAny ? 'Any' : `${sliderMinPoints} - ${sliderMaxPoints}`}
        </div>
        {pointsBounds && (
          <RangeSlider
            min={pointsBounds.min}
            max={pointsBounds.max}
            step={1}
            low={sliderMinPoints}
            high={sliderMaxPoints}
            disabled={!pointsBounds}
            onChange={(low, high) => {
              onChange({
                ...values,
                pointsMin: String(low),
                pointsMax: String(high),
              })
            }}
          />
        )}
      </div>

      <label className="filter-field">
        <span>Country</span>
        <select value={values.country} onChange={(e) => updateField('country', e.target.value)}>
          <option value="All">All</option>
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </label>

      <label className="filter-field">
        <span>Variety</span>
        <select value={values.variety} onChange={(e) => updateField('variety', e.target.value)}>
          <option value="All">All</option>
          {varieties.map((variety) => (
            <option key={variety} value={variety}>{variety}</option>
          ))}
        </select>
      </label>
    </div>
  )
}

export default FilterBar
