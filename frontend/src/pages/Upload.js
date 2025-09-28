import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDocuments } from '../contexts/DocumentContext';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  File,
  Image,
  FileImage
} from 'lucide-react';
import toast from 'react-hot-toast';

const Upload = () => {
  const { uploadDocument, uploading } = useDocuments();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Auto-fill title if empty
    if (acceptedFiles.length === 1 && !formData.title) {
      setFormData(prev => ({
        ...prev,
        title: acceptedFiles[0].name.replace(/\.[^/.]+$/, "") // Remove extension
      }));
    }
  }, [formData.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    // Upload files one by one
    for (const fileObj of uploadedFiles) {
      const result = await uploadDocument(
        fileObj.file, 
        formData.title || fileObj.file.name, 
        formData.description
      );
      
      if (result.success) {
        // Update file status
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          )
        );
      } else {
        // Update file status to error
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, status: 'error' }
              : f
          )
        );
      }
    }

    // Reset form after successful uploads
    const hasErrors = uploadedFiles.some(f => f.status === 'error');
    if (!hasErrors) {
      setFormData({ title: '', description: '' });
      setUploadedFiles([]);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'application/pdf':
        return <FileText className="h-6 w-6 text-red-600" />;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <FileText className="h-6 w-6 text-blue-600" />;
      case 'text/plain':
        return <File className="h-6 w-6 text-gray-600" />;
      case 'text/markdown':
        return <FileText className="h-6 w-6 text-purple-600" />;
      default:
        return <File className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
        <p className="text-gray-600">
          Upload PDFs, Word documents, text files, or Markdown files to your AI-powered knowledge base.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              {isDragActive ? (
                <div>
                  <p className="text-lg font-medium text-blue-600">Drop files here...</p>
                  <p className="text-sm text-blue-500">Release to upload</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOCX, TXT, MD files up to 10MB each
                  </p>
                </div>
              )}
              
              <button
                type="button"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Choose Files
              </button>
            </div>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Selected Files</h3>
              {uploadedFiles.map((fileObj) => (
                <div
                  key={fileObj.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(fileObj.file.type)}
                    <div>
                      <p className="font-medium text-gray-900">{fileObj.file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(fileObj.file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {fileObj.status === 'pending' && (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {fileObj.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {fileObj.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Document Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Enter document title"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Enter document description"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || uploadedFiles.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Upload Documents</span>
                </>
              )}
            </button>
          </form>

          {/* Supported Formats */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-4">Supported Formats</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-red-600" />
                <span className="text-sm text-gray-600">PDF Documents (.pdf)</span>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">Word Documents (.docx)</span>
              </div>
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-600">Text Files (.txt)</span>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-gray-600">Markdown Files (.md)</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Maximum file size: 10MB per file
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
