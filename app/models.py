from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# ===== USER AUTHENTICATION MODELS =====
# These models handle user registration, login, and JWT token responses
# Following the existing authentication pattern in your app

class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

# ===== DOCUMENT PROCESSING MODELS =====
# These models define the data structures for document upload, processing, and Q&A
# They will be used by the document processor, vector store, and Q&A service modules

class DocumentType(str, Enum):
    """Supported document types for upload and processing"""
    PDF = "pdf"
    TXT = "txt"
    DOCX = "docx"
    MD = "md"

class DocumentStatus(str, Enum):
    """Document processing status for tracking upload and processing states"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"

class DocumentUpload(BaseModel):
    """Model for document upload requests"""
    filename: str = Field(..., description="Original filename of the document")
    file_type: DocumentType = Field(..., description="Type of document being uploaded")
    file_size: int = Field(..., description="Size of the file in bytes")
    content: str = Field(..., description="Base64 encoded file content")
    tags: Optional[List[str]] = Field(default=[], description="Optional tags for categorization")
    description: Optional[str] = Field(default="", description="Optional description of the document")

class DocumentChunk(BaseModel):
    """Model representing a chunk of processed document text"""
    chunk_id: str = Field(..., description="Unique identifier for this chunk")
    document_id: str = Field(..., description="ID of the parent document")
    content: str = Field(..., description="Text content of this chunk")
    chunk_index: int = Field(..., description="Order of this chunk in the document")
    start_char: int = Field(..., description="Starting character position in original document")
    end_char: int = Field(..., description="Ending character position in original document")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata for this chunk")

class DocumentEmbedding(BaseModel):
    """Model for storing document embeddings in vector database"""
    embedding_id: str = Field(..., description="Unique identifier for this embedding")
    chunk_id: str = Field(..., description="ID of the associated document chunk")
    document_id: str = Field(..., description="ID of the parent document")
    embedding_vector: List[float] = Field(..., description="Vector representation of the chunk")
    model_name: str = Field(..., description="Name of the embedding model used")

class ProcessedDocument(BaseModel):
    """Model representing a fully processed document with all metadata"""
    document_id: str = Field(..., description="Unique identifier for the document")
    user_id: str = Field(..., description="ID of the user who uploaded the document")
    filename: str = Field(..., description="Original filename")
    file_type: DocumentType = Field(..., description="Type of document")
    file_size: int = Field(..., description="Size of the file in bytes")
    status: DocumentStatus = Field(..., description="Current processing status")
    uploaded_at: datetime = Field(..., description="Timestamp when document was uploaded")
    processed_at: Optional[datetime] = Field(default=None, description="Timestamp when processing completed")
    chunks: List[DocumentChunk] = Field(default=[], description="Text chunks extracted from document")
    embeddings: List[DocumentEmbedding] = Field(default=[], description="Vector embeddings of chunks")
    tags: List[str] = Field(default=[], description="Tags associated with document")
    description: str = Field(default="", description="User-provided description")
    summary: Optional[str] = Field(default=None, description="AI-generated summary of document")
    metadata: Dict[str, Any] = Field(default={}, description="Additional document metadata")

# ===== Q&A MODELS =====
# These models handle question-answering interactions and responses

class QuestionRequest(BaseModel):
    """Model for Q&A requests from users"""
    question: str = Field(..., description="User's question about the documents")
    document_ids: Optional[List[str]] = Field(default=None, description="Specific documents to search in (None = search all)")
    tags: Optional[List[str]] = Field(default=None, description="Filter by document tags")
    max_results: int = Field(default=5, ge=1, le=20, description="Maximum number of relevant chunks to return")
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0, description="Minimum similarity score for results")

class AnswerContext(BaseModel):
    """Model representing the context used to generate an answer"""
    chunk_id: str = Field(..., description="ID of the source chunk")
    document_id: str = Field(..., description="ID of the source document")
    document_name: str = Field(..., description="Name of the source document")
    content: str = Field(..., description="Relevant text content from the document")
    similarity_score: float = Field(..., description="Similarity score between question and content")
    chunk_index: int = Field(..., description="Position of this chunk in the document")

class QuestionResponse(BaseModel):
    """Model for Q&A responses to users"""
    question: str = Field(..., description="Original question asked")
    answer: str = Field(..., description="AI-generated answer based on document context")
    confidence_score: float = Field(..., description="Confidence score for the answer (0.0-1.0)")
    sources: List[AnswerContext] = Field(..., description="Source chunks used to generate the answer")
    timestamp: datetime = Field(..., description="When the question was processed")
    processing_time_ms: int = Field(..., description="Time taken to process the question in milliseconds")

class SearchRequest(BaseModel):
    """Model for semantic search requests"""
    query: str = Field(..., description="Search query text")
    document_ids: Optional[List[str]] = Field(default=None, description="Specific documents to search in")
    tags: Optional[List[str]] = Field(default=None, description="Filter by document tags")
    max_results: int = Field(default=10, ge=1, le=50, description="Maximum number of results to return")
    similarity_threshold: float = Field(default=0.6, ge=0.0, le=1.0, description="Minimum similarity score for results")

class SearchResult(BaseModel):
    """Model representing a semantic search result"""
    chunk_id: str = Field(..., description="ID of the matching chunk")
    document_id: str = Field(..., description="ID of the source document")
    document_name: str = Field(..., description="Name of the source document")
    content: str = Field(..., description="Relevant text content")
    similarity_score: float = Field(..., description="Similarity score between query and content")
    chunk_index: int = Field(..., description="Position of this chunk in the document")
    tags: List[str] = Field(default=[], description="Tags associated with the document")

class SearchResponse(BaseModel):
    """Model for semantic search responses"""
    query: str = Field(..., description="Original search query")
    results: List[SearchResult] = Field(..., description="List of matching document chunks")
    total_results: int = Field(..., description="Total number of results found")
    timestamp: datetime = Field(..., description="When the search was performed")
    processing_time_ms: int = Field(..., description="Time taken to perform the search")

# ===== DOCUMENT MANAGEMENT MODELS =====
# These models handle document listing, filtering, and management

class DocumentFilter(BaseModel):
    """Model for filtering documents in queries"""
    tags: Optional[List[str]] = Field(default=None, description="Filter by document tags")
    file_types: Optional[List[DocumentType]] = Field(default=None, description="Filter by file types")
    status: Optional[DocumentStatus] = Field(default=None, description="Filter by processing status")
    uploaded_after: Optional[datetime] = Field(default=None, description="Filter documents uploaded after this date")
    uploaded_before: Optional[datetime] = Field(default=None, description="Filter documents uploaded before this date")

class DocumentListResponse(BaseModel):
    """Model for document listing responses"""
    documents: List[ProcessedDocument] = Field(..., description="List of documents matching the filter")
    total_count: int = Field(..., description="Total number of documents matching the filter")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of documents per page")
    has_next: bool = Field(..., description="Whether there are more pages available")

class DocumentSummary(BaseModel):
    """Model for document summarization requests and responses"""
    document_id: str = Field(..., description="ID of the document to summarize")
    summary_type: str = Field(default="brief", description="Type of summary: 'brief', 'detailed', 'key_points'")
    max_length: int = Field(default=200, ge=50, le=1000, description="Maximum length of summary in words")

class DocumentTagRequest(BaseModel):
    """Model for adding/removing tags from documents"""
    document_id: str = Field(..., description="ID of the document")
    tags_to_add: Optional[List[str]] = Field(default=[], description="Tags to add to the document")
    tags_to_remove: Optional[List[str]] = Field(default=[], description="Tags to remove from the document")

# ===== DOCUMENTATION: WHAT WAS ADDED TO THIS FILE =====
"""
KEY COMPONENTS ADDED FOR AI-POWERED Q&A SYSTEM:

1. DOCUMENT PROCESSING MODELS:
   - DocumentType: Enum defining supported file formats (PDF, TXT, DOCX, MD)
   - DocumentStatus: Enum for tracking document processing states (uploaded, processing, processed, failed)
   - DocumentUpload: Handles file upload requests with metadata like filename, size, content, tags
   - DocumentChunk: Represents text chunks extracted from documents for vector processing
   - DocumentEmbedding: Stores vector embeddings of document chunks for semantic search
   - ProcessedDocument: Complete document model containing all metadata, chunks, and embeddings

2. Q&A INTERACTION MODELS:
   - QuestionRequest: User question input with filtering options (document IDs, tags, similarity thresholds)
   - AnswerContext: Source chunks used to generate answers with similarity scores
   - QuestionResponse: AI-generated answers with confidence scores and source attribution
   - SearchRequest/Response: Models for semantic search functionality across documents
   - SearchResult: Individual search results with similarity scores and metadata

3. DOCUMENT MANAGEMENT MODELS:
   - DocumentFilter: Advanced filtering for documents by tags, file types, dates, status
   - DocumentListResponse: Paginated document listings with metadata
   - DocumentSummary: Document summarization requests with different summary types
   - DocumentTagRequest: Tag management operations (add/remove tags from documents)

WHAT THESE MODELS ENABLE:
- Structured document upload and processing pipeline
- Vector-based semantic search across document collections
- AI-powered question answering with source attribution
- Document organization through tagging and filtering
- Comprehensive document metadata management
- Integration with vector databases (ChromaDB) and AI services (OpenAI)

INTEGRATION WITH EXISTING SYSTEM:
- Maintains compatibility with existing UserRegister, UserLogin, TokenResponse models
- All document operations will be user-scoped using JWT authentication
- Models designed to work with FastAPI's automatic request/response validation
- Ready for integration with document processor, vector store, and Q&A service modules
"""
