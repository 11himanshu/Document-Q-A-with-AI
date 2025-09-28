import os
from dotenv import load_dotenv

# load .env file from project root
load_dotenv()

# ===== AUTHENTICATION CONFIGURATION =====
# JWT Configuration for user authentication
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production-123456789")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# ===== DOCUMENT PROCESSING CONFIGURATION =====
# Settings for document upload, processing, and storage

# Maximum file size for uploads (in bytes) - 10MB default
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))

# Allowed file types for upload
ALLOWED_FILE_TYPES = ["pdf", "txt", "docx", "md"]

# Text chunking configuration for document processing
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))  # Characters per chunk
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))  # Overlap between chunks

# Directory for storing uploaded files
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

# ===== VECTOR DATABASE CONFIGURATION =====
# ChromaDB settings for document embeddings and semantic search

# Path to ChromaDB database
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")

# Collection name for document embeddings
CHROMA_COLLECTION_NAME = os.getenv("CHROMA_COLLECTION_NAME", "documents")

# Embedding model configuration
# sentence-transformers model for generating embeddings
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# ===== AI/LLM CONFIGURATION =====
# OpenAI API settings for Q&A and summarization

# OpenAI API key (required for AI features)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# OpenAI model to use for Q&A and summarization
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

# Temperature setting for AI responses (0.0 = deterministic, 1.0 = creative)
AI_TEMPERATURE = float(os.getenv("AI_TEMPERATURE", "0.1"))

# Maximum tokens for AI responses
AI_MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "500"))

# ===== SEARCH AND Q&A CONFIGURATION =====
# Settings for semantic search and question answering

# Default similarity threshold for search results
DEFAULT_SIMILARITY_THRESHOLD = float(os.getenv("DEFAULT_SIMILARITY_THRESHOLD", "0.7"))

# Maximum number of chunks to retrieve for Q&A
MAX_RETRIEVAL_CHUNKS = int(os.getenv("MAX_RETRIEVAL_CHUNKS", "5"))

# Maximum number of search results to return
MAX_SEARCH_RESULTS = int(os.getenv("MAX_SEARCH_RESULTS", "10"))

# ===== APPLICATION SETTINGS =====
# General application configuration

# Application name and version
APP_NAME = os.getenv("APP_NAME", "FastAPI QA App")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")

# Debug mode (set to True for development)
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# CORS origins for API access
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# ===== DOCUMENTATION: WHAT WAS ADDED TO THIS FILE =====
"""
KEY COMPONENTS ADDED FOR AI-POWERED Q&A SYSTEM:

1. DOCUMENT PROCESSING CONFIGURATION:
   - MAX_FILE_SIZE: Maximum file size for uploads (10MB default)
   - ALLOWED_FILE_TYPES: Supported file formats (pdf, txt, docx, md)
   - CHUNK_SIZE: Text chunk size for document processing (1000 characters)
   - CHUNK_OVERLAP: Overlap between chunks for better context (200 characters)
   - UPLOAD_DIR: Directory for storing uploaded files (./uploads)

2. VECTOR DATABASE CONFIGURATION:
   - CHROMA_DB_PATH: Path to ChromaDB database for persistent vector storage
   - CHROMA_COLLECTION_NAME: Collection name for document embeddings
   - EMBEDDING_MODEL: sentence-transformers model for generating embeddings (all-MiniLM-L6-v2)

3. AI/LLM CONFIGURATION:
   - OPENAI_API_KEY: API key for OpenAI services (required for AI features)
   - OPENAI_MODEL: GPT model for Q&A and summarization (gpt-3.5-turbo)
   - AI_TEMPERATURE: Creativity setting for AI responses (0.1 = deterministic)
   - AI_MAX_TOKENS: Maximum tokens for AI responses (500)

4. SEARCH AND Q&A CONFIGURATION:
   - DEFAULT_SIMILARITY_THRESHOLD: Minimum similarity score for search results (0.7)
   - MAX_RETRIEVAL_CHUNKS: Maximum chunks to retrieve for Q&A (5)
   - MAX_SEARCH_RESULTS: Maximum search results to return (10)

5. APPLICATION SETTINGS:
   - APP_NAME: Application name for API documentation
   - APP_VERSION: Version number for API versioning
   - DEBUG: Debug mode flag for development
   - CORS_ORIGINS: Allowed origins for cross-origin requests

WHAT THESE CONFIGURATIONS ENABLE:
- File upload validation and processing limits
- Vector database setup for semantic search
- AI service integration for Q&A and summarization
- Search result filtering and pagination
- Development and production environment management

INTEGRATION WITH EXISTING SYSTEM:
- Maintains existing JWT authentication configuration
- Extends configuration without breaking existing functionality
- Environment variable support for easy deployment configuration
- Ready for use by document processor, vector store, and Q&A service modules
"""
