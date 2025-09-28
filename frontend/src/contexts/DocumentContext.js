import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const DocumentContext = createContext();

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/documents');
      setDocuments(response.data.documents || []);
    } catch (error) {
      toast.error('Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file, title, description) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('description', description || '');

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Document uploaded successfully!');
      await fetchDocuments(); // Refresh documents list
      return { success: true, document: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Upload failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      await api.delete(`/documents/${documentId}`);
      toast.success('Document deleted successfully!');
      await fetchDocuments(); // Refresh documents list
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Delete failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const askQuestion = async (question, documentId = null) => {
    try {
      const payload = { question };
      if (documentId) {
        payload.document_id = documentId;
      }

      const response = await api.post('/qa/ask', payload);
      return { success: true, answer: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to get answer';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const searchDocuments = async (query, limit = 10) => {
    try {
      const response = await api.post('/search', {
        query,
        limit
      });
      return { success: true, results: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Search failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getSystemStatus = async () => {
    try {
      const response = await api.get('/status');
      return { success: true, status: response.data };
    } catch (error) {
      console.error('Error getting system status:', error);
      return { success: false, error: 'Failed to get system status' };
    }
  };

  const value = {
    documents,
    loading,
    uploading,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    askQuestion,
    searchDocuments,
    getSystemStatus
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};
