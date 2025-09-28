import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDocuments } from '../contexts/DocumentContext';
import { 
  Upload, 
  FileText, 
  MessageSquare, 
  Search, 
  TrendingUp, 
  Clock,
  BarChart3,
  Activity,
  Plus,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { documents, fetchDocuments, getSystemStatus } = useDocuments();
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchDocuments(),
        getSystemStatus().then(result => {
          if (result.success) {
            setSystemStatus(result.status);
          }
        })
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchDocuments, getSystemStatus]);

  const quickActions = [
    {
      title: 'Upload Document',
      description: 'Upload new documents to your knowledge base',
      icon: Upload,
      link: '/upload',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Ask Questions',
      description: 'Ask AI-powered questions about your documents',
      icon: MessageSquare,
      link: '/qa',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Search Documents',
      description: 'Find specific information across all documents',
      icon: Search,
      link: '/search',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'View Documents',
      description: 'Browse and manage your document library',
      icon: FileText,
      link: '/documents',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const stats = [
    {
      name: 'Total Documents',
      value: documents.length,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Processing Status',
      value: systemStatus?.system_status?.vector_store === 'healthy' ? 'Active' : 'Initializing',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'AI Service',
      value: systemStatus?.system_status?.qa_service === 'healthy' ? 'Ready' : 'Limited',
      icon: MessageSquare,
      color: systemStatus?.system_status?.qa_service === 'healthy' ? 'text-green-600' : 'text-yellow-600',
      bgColor: systemStatus?.system_status?.qa_service === 'healthy' ? 'bg-green-100' : 'bg-yellow-100'
    },
    {
      name: 'Storage Used',
      value: `${systemStatus?.user_stats?.total_chunks || 0} chunks`,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const recentDocuments = documents.slice(0, 5);

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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.email || 'User'}! 👋
        </h1>
        <p className="text-blue-100 text-lg">
          Your AI-powered document intelligence dashboard is ready.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className="group bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {action.description}
                </p>
                <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                  <span className="text-sm">Get started</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Documents */}
      {recentDocuments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Documents</h2>
            <Link
              to="/documents"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentDocuments.map((doc, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {doc.file_type} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        doc.status === 'processed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status}
                      </span>
                      <Link
                        to={`/qa?document=${doc.document_id}`}
                        className="text-blue-600 hover:text-blue-700 p-1"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Getting Started */}
      {documents.length === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Get Started with AI Q&A
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Upload your first document to start asking questions and searching through your content 
              with the power of AI. Support for PDFs, Word documents, and text files.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/upload"
                className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Upload className="h-5 w-5" />
                <span>Upload Your First Document</span>
              </Link>
              <Link
                to="/docs"
                className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                View API Documentation
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
