import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocuments } from '../contexts/DocumentContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, 
  MessageSquare, 
  FileText, 
  Bot, 
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const QA = () => {
  const { documents, fetchDocuments, askQuestion } = useDocuments();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [question, setQuestion] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, recent, processed

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    // Check if a specific document is selected via URL params
    const documentId = searchParams.get('document');
    if (documentId) {
      setSelectedDocument(documentId);
    }
  }, [searchParams]);

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'processed') return doc.status === 'processed';
    if (filter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(doc.created_at) > oneWeekAgo;
    }
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setLoading(true);
    
    // Add user question to chat history
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    // Get AI response
    const result = await askQuestion(question, selectedDocument || null);
    
    if (result.success) {
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: result.answer.answer,
        sources: result.answer.sources || [],
        confidence: result.answer.confidence || null,
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
    } else {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: result.error || 'Failed to get answer',
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    }
    
    setQuestion('');
    setLoading(false);
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const suggestedQuestions = [
    "What is the main topic of this document?",
    "Can you summarize the key points?",
    "What are the important dates mentioned?",
    "Who are the main people or organizations discussed?",
    "What conclusions or recommendations are made?"
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Q&A Assistant</h1>
        <p className="text-gray-600">
          Ask questions about your documents and get intelligent answers powered by AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Document Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Documents</h3>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="processed">Processed</option>
                  <option value="recent">Recent</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredDocuments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No documents found
                </p>
              ) : (
                filteredDocuments.map((doc) => (
                  <button
                    key={doc.document_id}
                    onClick={() => setSelectedDocument(
                      selectedDocument === doc.document_id ? '' : doc.document_id
                    )}
                    className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                      selectedDocument === doc.document_id
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-gray-500">{doc.file_type}</p>
                      </div>
                      {doc.status === 'processed' && (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
            
            {selectedDocument && (
              <button
                onClick={() => setSelectedDocument('')}
                className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Suggested Questions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Suggested Questions</h3>
            <div className="space-y-2">
              {suggestedQuestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setQuestion(suggestion)}
                  className="w-full text-left p-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-96">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Chat</h3>
                {selectedDocument && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Document specific
                  </span>
                )}
              </div>
              <button
                onClick={clearChat}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Clear chat
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <MessageSquare className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Start a conversation
                      </h4>
                      <p className="text-gray-500 max-w-md">
                        Ask questions about your documents or select a specific document to focus your questions.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl px-4 py-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.type === 'error'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'user' ? (
                          <User className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        ) : message.type === 'error' ? (
                          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Bot className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          
                          {/* AI Response Details */}
                          {message.type === 'ai' && (
                            <div className="mt-3 space-y-2">
                              {message.confidence && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Confidence:</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(message.confidence)}`}>
                                    {Math.round(message.confidence * 100)}%
                                  </span>
                                </div>
                              )}
                              
                              {message.sources && message.sources.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-1">Sources:</p>
                                  <div className="space-y-1">
                                    {message.sources.map((source, index) => (
                                      <div key={index} className="text-xs bg-white bg-opacity-50 p-2 rounded border">
                                        <p className="font-medium">{source.title}</p>
                                        {source.chunk_text && (
                                          <p className="text-gray-600 mt-1 line-clamp-2">
                                            {source.chunk_text.substring(0, 100)}...
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <p className="text-xs opacity-70 mt-2">
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-3xl px-4 py-3 bg-gray-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <div className="flex items-center space-x-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
              
              {selectedDocument && (
                <p className="text-xs text-gray-500 mt-2">
                  Asking about: {documents.find(d => d.document_id === selectedDocument)?.title}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QA;
