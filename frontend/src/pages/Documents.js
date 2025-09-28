import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocuments } from '../contexts/DocumentContext';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Trash2, 
  MessageSquare, 
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Documents = () => {
  const { documents, fetchDocuments, deleteDocument, loading } = useDocuments();
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filter, setFilter] = useState('all'); // all, processed, processing, error
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredAndSortedDocuments = documents
    .filter(doc => {
      // Filter by status
      if (filter !== 'all' && doc.status !== filter) return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower) ||
          doc.file_type.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleDelete = async (documentId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      const result = await deleteDocument(documentId);
      if (result.success) {
        toast.success('Document deleted successfully');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const DocumentCard = ({ doc }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 truncate max-w-48">
              {doc.title}
            </h3>
            <p className="text-sm text-gray-500">{doc.file_type}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(doc.status)}`}>
            {getStatusIcon(doc.status)}
            <span className="capitalize">{doc.status}</span>
          </span>
          
          <div className="flex items-center space-x-1">
            <Link
              to={`/qa?document=${doc.document_id}`}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
              title="Ask questions about this document"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
            
            <button
              onClick={() => handleDelete(doc.document_id, doc.title)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
              title="Delete document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {doc.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {doc.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(doc.created_at)}</span>
          </div>
          {doc.file_size && (
            <span>{formatFileSize(doc.file_size)}</span>
          )}
        </div>
        
        {doc.chunks_count && (
          <span className="text-blue-600 font-medium">
            {doc.chunks_count} chunks
          </span>
        )}
      </div>
    </div>
  );

  const DocumentListItem = ({ doc }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h3 className="font-medium text-gray-900 truncate">
                {doc.title}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(doc.status)}`}>
                {getStatusIcon(doc.status)}
                <span className="capitalize">{doc.status}</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span>{doc.file_type}</span>
              <span>{formatDate(doc.created_at)}</span>
              {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
              {doc.chunks_count && <span>{doc.chunks_count} chunks</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link
            to={`/qa?document=${doc.document_id}`}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
            title="Ask questions about this document"
          >
            <MessageSquare className="h-4 w-4" />
          </Link>
          
          <button
            onClick={() => handleDelete(doc.document_id, doc.title)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
            title="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-dots">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
          <p className="text-gray-600">
            Manage and organize your document library ({documents.length} documents)
          </p>
        </div>
        
        <Link
          to="/upload"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <FileText className="h-5 w-5" />
          <span>Upload New</span>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="processed">Processed</option>
                <option value="processing">Processing</option>
                <option value="error">Error</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                title="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid/List */}
      {filteredAndSortedDocuments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filter !== 'all' ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Upload your first document to get started with AI-powered Q&A.'
            }
          </p>
          {!searchTerm && filter === 'all' && (
            <Link
              to="/upload"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <FileText className="h-5 w-5" />
              <span>Upload Document</span>
            </Link>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredAndSortedDocuments.map((doc) => (
            viewMode === 'grid' ? (
              <DocumentCard key={doc.document_id} doc={doc} />
            ) : (
              <DocumentListItem key={doc.document_id} doc={doc} />
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
