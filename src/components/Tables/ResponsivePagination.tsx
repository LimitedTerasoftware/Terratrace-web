import React from 'react';

interface ResponsivePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  className?: string;
}

const ResponsivePagination: React.FC<ResponsivePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 0,
  className = ""
}) => {
  // Style functions for consistent button appearance across all states
  const getButtonStyles = (isActive = false, isDisabled = false) => {
    if (isDisabled) {
      return "px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-400 cursor-not-allowed transition-all duration-200";
    }
    if (isActive) {
      return "px-3 py-2 mx-0.5 rounded-lg font-medium bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all duration-200";
    }
    return "px-3 py-2 mx-0.5 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200 hover:border-gray-300 transition-all duration-200";
  };

  // Styles for Previous/Next navigation buttons
  const getNavButtonStyles = (isDisabled = false) => {
    if (isDisabled) {
      return "px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-400 cursor-not-allowed transition-all duration-200";
    }
    return "px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200 hover:border-gray-300 transition-all duration-200";
  };

  // Compact styles for mobile arrow buttons
  const getMobileNavButtonStyles = (isDisabled = false) => {
    if (isDisabled) {
      return "px-2 py-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed transition-all duration-200";
    }
    return "px-2 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200 hover:border-gray-300 transition-all duration-200";
  };

  // Generate smart page number buttons with ellipsis for large page counts
  const renderSmartPageNumbers = (maxPages = 8) => {
    // Simple case: show all pages if total count is small
    if (totalPages <= maxPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
        <button
          key={pageNum}
          className={getButtonStyles(currentPage === pageNum)}
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum}
        </button>
      ));
    }

    const pageNumbers = [];
    const halfRange = Math.floor((maxPages - 2) / 2); // Reserve space for first/last pages
    
    // Always show first page for easy navigation
    pageNumbers.push(
      <button
        key={1}
        className={getButtonStyles(currentPage === 1)}
        onClick={() => onPageChange(1)}
      >
        1
      </button>
    );

    // Calculate the middle range of pages to display
    let startPage = Math.max(2, currentPage - halfRange);
    let endPage = Math.min(totalPages - 1, currentPage + halfRange);
    
    // Adjust range to maintain consistent visible page count
    if (endPage - startPage + 1 < maxPages - 2) {
      if (startPage === 2) {
        endPage = Math.min(totalPages - 1, startPage + maxPages - 3);
      } else {
        startPage = Math.max(2, endPage - maxPages + 3);
      }
    }

    // Add ellipsis if there's a gap before middle pages
    if (startPage > 2) {
      pageNumbers.push(<span key="ellipsis1" className="px-3 py-2.5 mx-0.5 text-gray-400 font-medium">⋯</span>);
    }

    // Render the middle range of page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          className={getButtonStyles(currentPage === i)}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Add ellipsis if there's a gap after middle pages
    if (endPage < totalPages - 1) {
      pageNumbers.push(<span key="ellipsis2" className="px-3 py-2.5 mx-0.5 text-gray-400 font-medium">⋯</span>);
    }

    // Always show last page for easy navigation (if more than 1 page exists)
    if (totalPages > 1) {
      pageNumbers.push(
        <button
          key={totalPages}
          className={getButtonStyles(currentPage === totalPages)}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0 ${className}`}>
      {/* Left: Current page information */}
      <div className="text-sm font-medium text-gray-600">
        Page <span className="text-gray-900 font-semibold">{currentPage}</span> / <span className="text-gray-900 font-semibold">{totalPages}</span>
      </div>
      
      {/* Center: Navigation controls - responsive design */}
      <div className="flex items-center space-x-3">
        {/* Previous page button */}
        <button
          className={getNavButtonStyles(currentPage === 1)}
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        >
          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        
        {/* Desktop: Full page numbers (8 max) */}
        <div className="hidden lg:flex items-center space-x-1">
          {renderSmartPageNumbers()}
        </div>
        
        {/* Tablet: Reduced page numbers (5 max) */}
        <div className="hidden sm:flex lg:hidden items-center space-x-1">
          {renderSmartPageNumbers(5)}
        </div>
        
        {/* Mobile: Compact input with arrow navigation */}
        <div className="flex sm:hidden items-center space-x-2">
          {/* Previous arrow button */}
          <button
            className={getMobileNavButtonStyles(currentPage === 1)}
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Page input field */}
          <span className="text-sm font-medium text-gray-600">Page</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const newPage = parseInt(e.target.value);
              if (newPage >= 1 && newPage <= totalPages) {
                onPageChange(newPage);
              }
            }}
            className="w-16 px-3 py-1.5 border border-gray-200 rounded-lg text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-sm font-medium text-gray-600">of {totalPages}</span>
          
          {/* Next arrow button */}
          <button
            className={getMobileNavButtonStyles(currentPage >= totalPages)}
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Next page button */}
        <button
          className={getNavButtonStyles(currentPage >= totalPages)}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Right: Items per page count */}
      <div className="text-sm font-medium text-gray-600">
        <span className="text-gray-900 font-semibold">{itemsPerPage} / 15</span> Per page
      </div>
    </div>
  );
};

export default ResponsivePagination;