# 🚀 AI-Powered Document Q&A System

A complete, production-ready FastAPI application that enables AI-powered question answering on user-uploaded documents using advanced RAG (Retrieval-Augmented Generation) technology.

## 🌟 Features

- **📄 Multi-format Document Support**: Upload and process PDF, TXT, DOCX, and MD files
- **🤖 AI-Powered Q&A**: Ask intelligent questions about your documents using OpenAI GPT
- **🔍 Semantic Search**: Find relevant content across documents using vector similarity
- **🔐 Secure Authentication**: JWT-based user authentication with data isolation
- **📊 Document Analytics**: Track document statistics and usage patterns
- **⚡ High Performance**: Async/await architecture for optimal performance
- **📚 Interactive API Docs**: Built-in Swagger UI and ReDoc documentation
- **🏥 Health Monitoring**: Comprehensive system health checks and status reporting

## 🏗️ Architecture

### Core Components

1. **Document Processor**: Handles file upload, validation, and text extraction
2. **Vector Store**: ChromaDB-based storage for document embeddings
3. **Q&A Service**: RAG pipeline with OpenAI GPT integration
4. **Authentication System**: JWT-based security with user scoping
5. **API Layer**: FastAPI endpoints with comprehensive validation

### Technology Stack

- **Backend**: FastAPI, Python 3.9+
- **Vector Database**: ChromaDB
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **AI/LLM**: OpenAI GPT models
- **Authentication**: JWT with bcrypt password hashing
- **Document Processing**: PyPDF2, python-docx, python-magic
- **API Documentation**: Swagger UI, ReDoc

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- OpenAI API key (optional, for AI-powered answers)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd fastapi-QA-app
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables** (optional)
   ```bash
   export OPENAI_API_KEY="your-openai-api-key-here"
   ```

4. **Start the application**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access the application**
   - **API Documentation**: http://localhost:8000/docs
   - **Alternative Docs**: http://localhost:8000/redoc
   - **Health Check**: http://localhost:8000/health
   - **API Info**: http://localhost:8000/

## 📖 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User authentication
- `GET /protected` - Protected route example

### Document Management
- `POST /documents/upload` - Upload and process documents
- `GET /documents` - List user documents with filtering
- `DELETE /documents/{document_id}` - Delete documents

### Question Answering
- `POST /qa/ask` - AI-powered question answering

### Search
- `POST /search` - Semantic document search

### System
- `GET /health` - System health monitoring
- `GET /status` - User statistics and system status
- `GET /` - API information and endpoint summary

## 🔧 Configuration

The application uses environment variables for configuration:

```bash
# OpenAI Configuration (optional)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Database Configuration
CHROMA_DB_PATH=./chroma_db
CHROMA_COLLECTION_NAME=documents

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=pdf,txt,docx,md

# AI Configuration
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000
DEFAULT_SIMILARITY_THRESHOLD=0.3

# Security
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 📝 Usage Examples

### 1. Register and Login

```bash
# Register a new user
curl -X POST "http://localhost:8000/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpassword123"}'

# Login and get JWT token
curl -X POST "http://localhost:8000/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpassword123"}'
```

### 2. Upload a Document

```bash
# Upload a document (replace YOUR_JWT_TOKEN with actual token)
curl -X POST "http://localhost:8000/documents/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf" \
  -F "tags=research,ai" \
  -F "description=Research document about AI"
```

### 3. Ask Questions

```bash
# Ask a question about your documents
curl -X POST "http://localhost:8000/qa/ask" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the main topics discussed in my documents?",
    "max_chunks": 5,
    "similarity_threshold": 0.3
  }'
```

### 4. Search Documents

```bash
# Search for specific content
curl -X POST "http://localhost:8000/search" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning algorithms",
    "max_results": 10,
    "similarity_threshold": 0.4
  }'
```

## 🧠 Understanding RAG (Retrieval-Augmented Generation)

### What is RAG?

RAG (Retrieval-Augmented Generation) is an advanced AI technique that combines the power of information retrieval with text generation to provide accurate, context-aware answers. Instead of relying solely on pre-trained knowledge, RAG systems retrieve relevant information from a knowledge base and use it to generate more accurate and up-to-date responses.

### How RAG Works

1. **Document Processing**: Documents are processed and broken into chunks
2. **Embedding Generation**: Each chunk is converted to a vector representation
3. **Vector Storage**: Embeddings are stored in a vector database
4. **Query Processing**: User questions are converted to embeddings
5. **Retrieval**: Similar document chunks are retrieved based on vector similarity
6. **Generation**: AI model generates answers using retrieved context

### RAG Pipeline in This Application

```
User Question → Embedding → Vector Search → Context Retrieval → AI Generation → Answer
     ↓              ↓            ↓              ↓              ↓            ↓
  "What is AI?" → [0.1,0.2...] → Similarity → Document Chunks → GPT Model → "AI is..."
```

## 🔍 Key Features Explained

### 1. Document Processing
- **Multi-format Support**: Handles PDF, TXT, DOCX, and MD files
- **Intelligent Chunking**: Breaks documents into optimal-sized chunks with overlap
- **Metadata Extraction**: Extracts and stores document metadata
- **File Validation**: Ensures file integrity and security

### 2. Vector Storage
- **ChromaDB Integration**: Persistent vector database for scalability
- **Sentence Transformers**: High-quality embeddings using all-MiniLM-L6-v2
- **User Isolation**: Separate collections per user for data security
- **Similarity Search**: Fast vector-based similarity search

### 3. AI-Powered Q&A
- **Question Classification**: Automatically categorizes question types
- **Context Retrieval**: Finds most relevant document chunks
- **Prompt Engineering**: Optimized prompts for different question types
- **Source Attribution**: Provides citations and source information

### 4. Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **User Scoping**: All operations are scoped to authenticated users
- **Password Hashing**: Secure password storage with bcrypt
- **Input Validation**: Comprehensive request validation

## 🏥 Monitoring & Health Checks

The application includes comprehensive monitoring:

- **System Health**: Check status of all components
- **Service Status**: Monitor OpenAI, ChromaDB, and other services
- **User Analytics**: Track document statistics and usage
- **Error Logging**: Detailed error reporting and debugging

## 🔧 Development

### Project Structure

```
fastapi-QA-app/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application and endpoints
│   ├── auth.py              # Authentication system
│   ├── config.py            # Configuration settings
│   ├── db.py                # Database models
│   ├── models.py            # Pydantic models
│   ├── document_processor.py # Document processing logic
│   ├── vector_store.py      # Vector database operations
│   └── qa_service.py        # Q&A service with RAG pipeline
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

### Running Tests

```bash
# Test individual components
python -c "from app.document_processor import DocumentProcessor; print('✅ Document processor OK')"
python -c "from app.vector_store import VectorStore; print('✅ Vector store OK')"
python -c "from app.qa_service import QAService; print('✅ Q&A service OK')"
```

## 🚀 Production Deployment

### Environment Setup

1. **Set production environment variables**
2. **Configure proper JWT secrets**
3. **Set up persistent storage for ChromaDB**
4. **Configure CORS for your domain**
5. **Set up monitoring and logging**

### Docker Deployment (Optional)

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs`
- Review the health status at `/health`
- Check system logs for error details

## 🎯 Roadmap

- [ ] Frontend web interface
- [ ] Advanced document analytics
- [ ] Multi-language support
- [ ] Real-time collaboration
- [ ] Advanced search filters
- [ ] Document versioning
- [ ] API rate limiting
- [ ] Caching layer

---

**Built with ❤️ using FastAPI, ChromaDB, and OpenAI**
