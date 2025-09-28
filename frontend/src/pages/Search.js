import React, { useState } from 'react';
import { useDocuments } from '../contexts/DocumentContext';
import { 
  Search, 
  FileText, 
  Clock, 
  Filter,
  SortAsc,
  SortDesc,
  ExternalLink,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

const Search = () => {
  const { searchDocuments } = useDocuments();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('similarity'); // similarity, date, title
  const [sortOrder, setSortOrder] = useState('desc');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    const result = await searchDocuments(query.trim(), 20);
    
    if (result.success) {
      setResults(result.results.results || []);
      if (result.results.results?.length === 0) {
        toast.info('No results found for your search query');
      }
    }
    
    setLoading(false);
  };

  const sortedResults = [...results].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'similarity':
        aValue = a.similarity_score || 0;
        bValue = b.similarity_score || 0;
        break;
      case 'date':
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
        break;
      case 'title':
        aValue = a.document_title || '';
        bValue = b.document_title || '';
        break;
      default:
        aValue = a.similarity_score || 0;
        bValue = b.similarity_score || 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSimilarityColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const suggestedQueries = [
    "What are the main topics discussed?",
    "Find information about dates and deadlines",
    "What recommendations are made?",
    "Who are the key people mentioned?",
    "What are the important conclusions?"
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Semantic Search</h1>
        <p className="text-gray-600">
          Search across all your documents using natural language and find relevant information instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Search</h3>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your search query..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sort Options */}
          {results.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Sort Results</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="similarity">Relevance</option>
                    <option value="date">Date</option>
                    <option value="title">Title</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Queries */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Suggested Searches</h3>
            <div className="space-y-2">
              {suggestedQueries.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(suggestion)}
                  className="w-full text-left p-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3 space-y-4">
          {!hasSearched ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Your Search
              </h3>
              <p className="text-gray-500 mb-6">
                Enter a natural language query to search across all your documents. 
                Our AI will find the most relevant content for you.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Semantic Search</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Find content based on meaning, not just keywords
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-gray-900">All Documents</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Search across your entire document library
                  </p>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="loading-dots mx-auto mb-4">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              <p className="text-gray-600">Searching through your documents...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Results Found
              </h3>
              <p className="text-gray-500 mb-6">
                Try different keywords or rephrase your search query.
              </p>
              <button
                onClick={() => setQuery('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Search Results ({results.length})
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Results for: "{query}"
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Found in milliseconds</span>
                  </div>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-4">
                {sortedResults.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {result.document_title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {result.document_type} • {formatDate(result.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSimilarityColor(result.similarity_score)}`}>
                          {Math.round(result.similarity_score * 100)}% match
                        </span>
                        
                        <a
                          href={`/qa?document=${result.document_id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                          title="Ask questions about this document"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Relevant Content:
                        </h5>
                        <p className="text-gray-600 leading-relaxed">
                          {highlightText(result.chunk_text, query)}
                        </p>
                      </div>
                      
                      {result.metadata && Object.keys(result.metadata).length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Metadata:
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(result.metadata).map(([key, value]) => (
                              <span
                                key={key}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                              >
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
