import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, AlertCircle, Zap, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { parseIntent, generateSuggestions, isIntentMeaningful, formatIntentForDisplay } from '@/lib/intentParser';
import { filterProductsByIntent, shouldDisplayResults, getNoResultsMessage } from '@/lib/ruleBasedFilter';
import './SmartSearchModal.css';

const SmartSearchModal = ({ isOpen, onClose, products = [], subcategories = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [parsedIntent, setParsedIntent] = useState(null);
  const [filterInfo, setFilterInfo] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Generate suggestions as user types
  const handleInputChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setHasSearched(false);
    setSearchResults([]);

    if (query.trim().length >= 2) {
      const newSuggestions = generateSuggestions(query);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Add suggestion to search query
  const handleSuggestionClick = (suggestion) => {
    const newQuery = searchQuery.trim() + ' ' + suggestion.text;
    setSearchQuery(newQuery);
    setSuggestions([]);
    setShowSuggestions(false);
    // Focus on input for user to continue typing
    if (inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      setTimeout(() => {
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        );
      }, 0);
    }
  };

  // Execute search on button click
  const performSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setParsedIntent(null);
      setFilterInfo(null);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setSuggestions([]);
    setShowSuggestions(false);

    // Small delay for better UX perception
    setTimeout(() => {
      // Parse intent from query
      const intent = parseIntent(searchQuery);
      setParsedIntent(intent);

      // Check if intent is meaningful
      if (!isIntentMeaningful(intent)) {
        setSearchResults([]);
        setFilterInfo({
          totalProducts: products.length,
          appliedFilters: 0,
          matchingProducts: 0,
          filtersCriteria: [],
        });
        setHasSearched(true);
        setIsSearching(false);
        return;
      }

      // Filter products based on intent with hybrid logic
      const { results, matchInfo } = filterProductsByIntent(
        products,
        intent,
        subcategories,
        { requireMinResults: false }
      );

      setSearchResults(results);
      setFilterInfo(matchInfo);
      setHasSearched(true);
      setIsSearching(false);
    }, 300);
  }, [searchQuery, products, subcategories]);

  // Handle Enter key to search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  };

  // Clear search
  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setParsedIntent(null);
    setFilterInfo(null);
    setHasSearched(false);
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Close modal
  const handleClose = () => {
    handleClear();
    onClose();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target !== inputRef.current && !e.target.closest('.smart-search-suggestions')) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSuggestions]);

  if (!isOpen) return null;

  const shouldShowResults = hasSearched && filterInfo && filterInfo.matchingProducts > 0;
  const showNoResults = hasSearched && filterInfo && filterInfo.matchingProducts === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="smart-search-backdrop"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="smart-search-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="smart-search-header">
              <div className="smart-search-title-section">
                <Zap className="smart-search-icon-title" />
                <div>
                  <h2 className="smart-search-title">البحث الذكي</h2>
                  <p className="smart-search-subtitle">Smart Search</p>
                </div>
              </div>
              <motion.button
                onClick={handleClose}
                className="smart-search-close-btn"
                aria-label="Close search"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={22} />
              </motion.button>
            </div>

            {/* Search Input Section */}
            <div className="smart-search-input-section">
              <div className="smart-search-input-wrapper">
                <Search size={20} className="smart-search-input-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="مثال: شامبو لترطيب الشعر الجاف"
                  className="smart-search-input"
                  autoFocus
                  autoComplete="off"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={handleClear}
                      className="smart-search-clear-btn"
                      aria-label="Clear search"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                    >
                      <X size={18} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="smart-search-suggestions"
                  >
                    <div className="smart-search-suggestions-label">
                      اقتراحات
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="smart-search-suggestion-item"
                      >
                        <span className="suggestion-icon">{suggestion.icon}</span>
                        <span className="suggestion-text">{suggestion.text}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Description - Show only when no search has been made */}
            <AnimatePresence>
              {!hasSearched && !searchQuery && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="smart-search-description show"
                >
                  <p>كيفية البحث:</p>
                  <ul>
                    <li>نوع المنتج (شامبو، بلسم، سيروم، ماسك)</li>
                    <li>المشكلة (جفاف، قشرة، دهنية، تساقط)</li>
                    <li>الفوائد (ترطيب، لمعان، تقوية، تفتيح)</li>
                    <li>نوع الشعر أو البشرة</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Button */}
            <div className="smart-search-action-section">
              <button
                onClick={performSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="smart-search-button"
              >
                {isSearching ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader size={16} />
                    </motion.div>
                    جاري البحث...
                  </>
                ) : (
                  'ابحث الآن'
                )}
              </button>
            </div>

            {/* Parsed Intent Display - Badge Style */}
            <AnimatePresence>
              {hasSearched && parsedIntent && isIntentMeaningful(parsedIntent) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="smart-search-intent-display"
                >
                  <div className="intent-label">✓ فُهم البحث</div>
                  <div className="intent-text">
                    {formatIntentForDisplay(parsedIntent, 'ar')}
                  </div>
                  <div className="intent-confidence">
                    دقة التحليل: {parsedIntent.confidence}%
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Section */}
            <AnimatePresence>
              {hasSearched && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="smart-search-results-section"
                >
                  {shouldShowResults ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="results-header"
                      >
                        <h3 className="results-title">
                          {filterInfo.matchingProducts === 1
                            ? 'وجدنا منتج واحد'
                            : `وجدنا ${filterInfo.matchingProducts} منتج`}
                        </h3>
                        <p className="results-subtitle">
                          يطابق معايير البحث
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="smart-search-grid"
                      >
                        {searchResults.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: Math.min(index * 0.08, 0.4),
                              duration: 0.3,
                            }}
                          >
                            <ProductCard product={product} />
                          </motion.div>
                        ))}
                      </motion.div>
                    </>
                  ) : showNoResults ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="smart-search-no-results"
                    >
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <AlertCircle size={60} className="no-results-icon" />
                      </motion.div>
                      <h3 className="no-results-title">
                        لم نجد نتائج مطابقة
                      </h3>
                      <p className="no-results-text">
                        {getNoResultsMessage()}
                      </p>
                      <motion.button
                        onClick={handleClear}
                        className="no-results-action"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        جرب بحثاً جديداً
                      </motion.button>
                    </motion.div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SmartSearchModal;
