interface FilterValues {
  priceMin: string
  priceMax: string
  pointsMin: string
  pointsMax: string
  country: string
  variety: string
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
        <div className="range-inputs">
          <input
            type="range"
            min={priceBounds?.min ?? 0}
            max={priceBounds?.max ?? 0}
            step={1}
            disabled={!priceBounds}
            value={sliderMinPrice}
            onChange={(e) => {
              const next = Math.min(Number(e.target.value), sliderMaxPrice)
              updateField('priceMin', String(next))
            }}
          />
          <input
            type="range"
            min={priceBounds?.min ?? 0}
            max={priceBounds?.max ?? 0}
            step={1}
            disabled={!priceBounds}
            value={sliderMaxPrice}
            onChange={(e) => {
              const next = Math.max(Number(e.target.value), sliderMinPrice)
              updateField('priceMax', String(next))
            }}
          />
        </div>
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
        <div className="range-inputs">
          <input
            type="range"
            min={pointsBounds?.min ?? 0}
            max={pointsBounds?.max ?? 0}
            step={1}
            disabled={!pointsBounds}
            value={sliderMinPoints}
            onChange={(e) => {
              const next = Math.min(Number(e.target.value), sliderMaxPoints)
              updateField('pointsMin', String(next))
            }}
          />
          <input
            type="range"
            min={pointsBounds?.min ?? 0}
            max={pointsBounds?.max ?? 0}
            step={1}
            disabled={!pointsBounds}
            value={sliderMaxPoints}
            onChange={(e) => {
              const next = Math.max(Number(e.target.value), sliderMinPoints)
              updateField('pointsMax', String(next))
            }}
          />
        </div>
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

export type { FilterValues }
export default FilterBar
