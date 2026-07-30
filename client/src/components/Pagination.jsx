export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination" data-testid="pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        data-testid="pagination-prev"
      >
        Previous
      </button>
      <span className="pagination-status" data-testid="pagination-status">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        data-testid="pagination-next"
      >
        Next
      </button>
    </div>
  );
}
