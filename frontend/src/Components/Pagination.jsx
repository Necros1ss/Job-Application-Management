import PropTypes from "prop-types";

const getVisiblePages = (currentPage, totalPages) => {
  const safeTotal = Math.max(Number(totalPages) || 1, 1);
  const safeCurrent = Math.min(Math.max(Number(currentPage) || 1, 1), safeTotal);
  const maxVisible = 5;

  let start = Math.max(safeCurrent - Math.floor(maxVisible / 2), 1);
  const end = Math.min(start + maxVisible - 1, safeTotal);

  start = Math.max(Math.min(start, Math.max(end - maxVisible + 1, 1)), 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const safeTotal = Math.max(Number(totalPages) || 1, 1);
  const safeCurrent = Math.min(Math.max(Number(currentPage) || 1, 1), safeTotal);
  const pages = getVisiblePages(safeCurrent, safeTotal);

  if (safeTotal <= 1) {
    return null;
  }

  const handlePageChange = (page) => {
    if (page < 1 || page > safeTotal || page === safeCurrent) {
      return;
    }

    onPageChange(page);
  };

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => handlePageChange(safeCurrent - 1)}
        disabled={safeCurrent === 1}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => handlePageChange(page)}
          aria-current={page === safeCurrent ? "page" : undefined}
          className={`h-10 min-w-10 rounded-lg px-3 text-sm font-bold transition ${
            page === safeCurrent
              ? "bg-emerald-600 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => handlePageChange(safeCurrent + 1)}
        disabled={safeCurrent === safeTotal}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;

Pagination.propTypes = {
  currentPage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  totalPages: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onPageChange: PropTypes.func.isRequired,
};
