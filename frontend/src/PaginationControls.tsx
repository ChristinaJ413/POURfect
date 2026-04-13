interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

function PaginationControls({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: PaginationControlsProps): JSX.Element {
  if (totalPages <= 1) return <></>

  return (
    <div className="pagination-controls">
      <button type="button" onClick={onPrevious} disabled={currentPage === 1}>
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button type="button" onClick={onNext} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  )
}

export default PaginationControls
