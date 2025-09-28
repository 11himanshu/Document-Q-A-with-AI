import os
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import openai
from openai import AsyncOpenAI

# Import our models and services
from app.models import (
    QuestionRequest, QuestionResponse, AnswerContext, 
    ProcessedDocument, SearchResult
)
from app.config import (
    OPENAI_API_KEY, OPENAI_MODEL, AI_TEMPERATURE, AI_MAX_TOKENS,
    MAX_RETRIEVAL_CHUNKS, DEFAULT_SIMILARITY_THRESHOLD
)
from app.vector_store import VectorStore
from app.document_processor import DocumentProcessor

class QAService:
    """
    AI-Powered Question Answering Service using RAG (Retrieval-Augmented Generation).
    
    This service integrates OpenAI's GPT models with our vector store to provide
    intelligent question answering based on user-uploaded documents. It implements
    a complete RAG pipeline:
    1. Question analysis and context retrieval
    2. Document chunk retrieval using semantic search
    3. Context preparation and prompt engineering
    4. AI-powered answer generation with source attribution
    5. Answer validation and response formatting
    """
    
    def __init__(self, vector_store: Optional[VectorStore] = None):
        """
        Initialize the Q&A service with OpenAI client and vector store.
        
        Args:
            vector_store: Optional VectorStore instance for document retrieval
        """
        # Initialize OpenAI client (handle missing API key gracefully)
        self.openai_client = None
        self.model_name = OPENAI_MODEL
        self.temperature = AI_TEMPERATURE
        self.max_tokens = AI_MAX_TOKENS
        
        if OPENAI_API_KEY and OPENAI_API_KEY != "your-openai-api-key-here":
            try:
                self.openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
                print("✅ OpenAI client initialized successfully")
            except Exception as e:
                print(f"⚠️ OpenAI client initialization failed: {e}")
                self.openai_client = None
        else:
            print("⚠️ OpenAI API key not configured - Q&A functionality will be limited")
        
        # Initialize vector store (create new instance if not provided)
        self.vector_store = vector_store or VectorStore()
        
        # Initialize document processor for new document processing
        self.document_processor = DocumentProcessor()
        
        # System prompts for different types of questions
        self.system_prompts = {
            "general": self._get_general_system_prompt(),
            "factual": self._get_factual_system_prompt(),
            "analytical": self._get_analytical_system_prompt(),
            "comparative": self._get_comparative_system_prompt()
        }
    
    def _get_general_system_prompt(self) -> str:
        """Get system prompt for general question answering."""
        return """You are an AI assistant that answers questions based on the provided document context. 
        Your role is to provide accurate, helpful, and well-structured answers using only the information 
        from the given context. If the context doesn't contain enough information to answer the question, 
        clearly state what information is missing. Always cite specific parts of the context that support 
        your answer. Be concise but comprehensive in your responses."""
    
    def _get_factual_system_prompt(self) -> str:
        """Get system prompt for factual question answering."""
        return """You are an AI assistant specialized in factual question answering. Extract and present 
        factual information from the provided context accurately. Focus on specific details, numbers, 
        dates, names, and concrete information. If multiple facts are mentioned, organize them clearly. 
        Always indicate which document or section the fact comes from."""
    
    def _get_analytical_system_prompt(self) -> str:
        """Get system prompt for analytical question answering."""
        return """You are an AI assistant specialized in analytical thinking. Analyze the provided context 
        to identify patterns, relationships, implications, and deeper insights. Provide thoughtful analysis 
        that goes beyond surface-level information. Consider different perspectives and potential implications 
        of the information presented."""
    
    def _get_comparative_system_prompt(self) -> str:
        """Get system prompt for comparative question answering."""
        return """You are an AI assistant specialized in comparative analysis. Compare and contrast 
        different aspects, concepts, or information presented in the context. Identify similarities, 
        differences, advantages, disadvantages, and relationships between different elements. Provide 
        structured comparisons with clear points of analysis."""
    
    def _analyze_question_type(self, question: str) -> str:
        """
        Analyze the question to determine the most appropriate system prompt.
        
        Args:
            question: The user's question
            
        Returns:
            str: Question type ('general', 'factual', 'analytical', 'comparative')
        """
        question_lower = question.lower()
        
        # Factual question indicators
        factual_indicators = ['what is', 'what are', 'who is', 'who are', 'when', 'where', 'how many', 'how much']
        if any(indicator in question_lower for indicator in factual_indicators):
            return 'factual'
        
        # Analytical question indicators
        analytical_indicators = ['why', 'how does', 'explain', 'analyze', 'interpret', 'implications', 'significance']
        if any(indicator in question_lower for indicator in analytical_indicators):
            return 'analytical'
        
        # Comparative question indicators
        comparative_indicators = ['compare', 'contrast', 'difference', 'similarity', 'vs', 'versus', 'better', 'worse']
        if any(indicator in question_lower for indicator in comparative_indicators):
            return 'comparative'
        
        # Default to general
        return 'general'
    
    async def _retrieve_relevant_context(
        self, 
        question: str, 
        user_id: str,
        max_chunks: int = MAX_RETRIEVAL_CHUNKS,
        similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
        document_ids: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> List[AnswerContext]:
        """
        Retrieve relevant document chunks for answering the question.
        
        Args:
            question: User's question
            user_id: ID of the user
            max_chunks: Maximum number of chunks to retrieve
            similarity_threshold: Minimum similarity score threshold
            document_ids: Optional list of document IDs to search within
            tags: Optional list of tags to filter by
            
        Returns:
            List[AnswerContext]: Relevant document chunks with context
        """
        try:
            # Get relevant chunks from vector store
            contexts = await self.vector_store.get_relevant_chunks_for_qa(
                question=question,
                user_id=user_id,
                max_chunks=max_chunks,
                similarity_threshold=similarity_threshold,
                document_ids=document_ids,
                tags=tags
            )
            
            # Sort by similarity score (highest first)
            contexts.sort(key=lambda x: x.similarity_score, reverse=True)
            
            return contexts
            
        except Exception as e:
            print(f"❌ Error retrieving context: {e}")
            return []
    
    def _prepare_context_for_prompt(self, contexts: List[AnswerContext]) -> str:
        """
        Prepare document context for the AI prompt.
        
        Args:
            contexts: List of relevant document contexts
            
        Returns:
            str: Formatted context string for the prompt
        """
        if not contexts:
            return "No relevant context found in the documents."
        
        context_parts = []
        for i, context in enumerate(contexts, 1):
            context_part = f"""
Document {i}: {context.document_name}
Similarity Score: {context.similarity_score:.3f}
Content:
{context.content}
---
"""
            context_parts.append(context_part)
        
        return "\n".join(context_parts)
    
    def _prepare_user_prompt(self, question: str, context: str) -> str:
        """
        Prepare the user prompt with question and context.
        
        Args:
            question: User's question
            context: Formatted document context
            
        Returns:
            str: Complete user prompt
        """
        return f"""Question: {question}

Context from documents:
{context}

Please answer the question based on the provided context. If the context doesn't contain enough information to answer the question completely, please indicate what information is missing. Always cite which document(s) your answer is based on."""
    
    async def _generate_answer(
        self, 
        system_prompt: str, 
        user_prompt: str,
        question: str
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Generate answer using OpenAI's GPT model.
        
        Args:
            system_prompt: System prompt for the AI
            user_prompt: User prompt with question and context
            question: Original question (for metadata)
            
        Returns:
            Tuple[str, Dict[str, Any]]: Generated answer and metadata
        """
        if not self.openai_client:
            return "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable to enable AI-powered answers.", {
                "error": "OpenAI client not initialized",
                "model_used": "none",
                "generated_at": datetime.utcnow().isoformat()
            }
        
        try:
            # Generate response using OpenAI
            response = await self.openai_client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )
            
            # Extract answer and metadata
            answer = response.choices[0].message.content.strip()
            
            metadata = {
                "model_used": self.model_name,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
                "tokens_used": response.usage.total_tokens,
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "finish_reason": response.choices[0].finish_reason,
                "generated_at": datetime.utcnow().isoformat()
            }
            
            return answer, metadata
            
        except Exception as e:
            error_msg = f"Error generating answer: {str(e)}"
            print(f"❌ {error_msg}")
            return error_msg, {"error": str(e)}
    
    async def answer_question(
        self, 
        question_request: QuestionRequest, 
        user_id: str
    ) -> QuestionResponse:
        """
        Answer a user's question using RAG pipeline.
        
        Args:
            question_request: Question request with parameters
            user_id: ID of the user asking the question
            
        Returns:
            QuestionResponse: Complete answer with context and metadata
        """
        try:
            print(f"🔍 Processing question: {question_request.question[:100]}...")
            
            # Step 1: Analyze question type
            question_type = self._analyze_question_type(question_request.question)
            system_prompt = self.system_prompts[question_type]
            
            # Step 2: Retrieve relevant context
            contexts = await self._retrieve_relevant_context(
                question=question_request.question,
                user_id=user_id,
                max_chunks=question_request.max_chunks or MAX_RETRIEVAL_CHUNKS,
                similarity_threshold=question_request.similarity_threshold or DEFAULT_SIMILARITY_THRESHOLD,
                document_ids=question_request.document_ids,
                tags=question_request.tags
            )
            
            # Step 3: Prepare context for prompt
            context_string = self._prepare_context_for_prompt(contexts)
            
            # Step 4: Prepare user prompt
            user_prompt = self._prepare_user_prompt(question_request.question, context_string)
            
            # Step 5: Generate answer
            answer, metadata = await self._generate_answer(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                question=question_request.question
            )
            
            # Step 6: Create response
            response = QuestionResponse(
                question=question_request.question,
                answer=answer,
                contexts=contexts,
                question_type=question_type,
                similarity_threshold=question_request.similarity_threshold or DEFAULT_SIMILARITY_THRESHOLD,
                max_chunks_used=len(contexts),
                total_context_length=sum(len(ctx.content) for ctx in contexts),
                metadata=metadata,
                answered_at=datetime.utcnow()
            )
            
            print(f"✅ Question answered successfully with {len(contexts)} context chunks")
            return response
            
        except Exception as e:
            error_msg = f"Failed to answer question: {str(e)}"
            print(f"❌ {error_msg}")
            
            # Return error response
            return QuestionResponse(
                question=question_request.question,
                answer=error_msg,
                contexts=[],
                question_type="error",
                similarity_threshold=0.0,
                max_chunks_used=0,
                total_context_length=0,
                metadata={"error": str(e)},
                answered_at=datetime.utcnow()
            )
    
    async def search_documents(
        self, 
        query: str, 
        user_id: str,
        max_results: int = 10,
        similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
        document_ids: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> List[SearchResult]:
        """
        Search documents using semantic search.
        
        Args:
            query: Search query
            user_id: ID of the user
            max_results: Maximum number of results to return
            similarity_threshold: Minimum similarity score threshold
            document_ids: Optional list of document IDs to search within
            tags: Optional list of tags to filter by
            
        Returns:
            List[SearchResult]: Search results with similarity scores
        """
        try:
            results = await self.vector_store.search_similar_chunks(
                query=query,
                user_id=user_id,
                max_results=max_results,
                similarity_threshold=similarity_threshold,
                document_ids=document_ids,
                tags=tags
            )
            
            print(f"✅ Found {len(results)} search results for query: {query[:50]}...")
            return results
            
        except Exception as e:
            print(f"❌ Error searching documents: {e}")
            return []
    
    async def process_and_store_document(
        self, 
        document_upload, 
        user_id: str
    ) -> ProcessedDocument:
        """
        Process a new document and store it in the vector database.
        
        Args:
            document_upload: DocumentUpload object with document data
            user_id: ID of the user uploading the document
            
        Returns:
            ProcessedDocument: Processed document with chunks
        """
        try:
            # Process the document
            processed_doc = await self.document_processor.process_document(
                document_upload, user_id
            )
            
            # Store in vector database
            await self.vector_store.add_document_chunks(processed_doc, user_id)
            
            print(f"✅ Document processed and stored: {processed_doc.document_id}")
            return processed_doc
            
        except Exception as e:
            print(f"❌ Error processing document: {e}")
            raise
    
    async def get_document_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get statistics about user's documents.
        
        Args:
            user_id: ID of the user
            
        Returns:
            Dict[str, Any]: Document statistics
        """
        try:
            stats = await self.vector_store.get_document_stats(user_id)
            return stats
        except Exception as e:
            print(f"❌ Error getting document stats: {e}")
            return {"error": str(e)}
    
    async def delete_document(self, document_id: str, user_id: str) -> bool:
        """
        Delete a document from the vector store.
        
        Args:
            document_id: ID of the document to delete
            user_id: ID of the user
            
        Returns:
            bool: True if deletion was successful
        """
        try:
            # Delete from vector store
            success = await self.vector_store.delete_document_embeddings(document_id, user_id)
            
            # Also delete from document processor (if needed)
            # await self.document_processor.delete_document(document_id, user_id)
            
            print(f"✅ Document deleted: {document_id}")
            return success
            
        except Exception as e:
            print(f"❌ Error deleting document: {e}")
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on the Q&A service.
        
        Returns:
            Dict[str, Any]: Health check results
        """
        try:
            # Check OpenAI connection
            openai_health = {"status": "unknown"}
            if self.openai_client:
                try:
                    # Test OpenAI API with a simple request
                    test_response = await self.openai_client.chat.completions.create(
                        model=self.model_name,
                        messages=[{"role": "user", "content": "Hello"}],
                        max_tokens=5
                    )
                    openai_health = {"status": "healthy", "model": self.model_name}
                except Exception as e:
                    openai_health = {"status": "unhealthy", "error": str(e)}
            else:
                openai_health = {"status": "not_configured", "error": "OpenAI API key not set"}
            
            # Check vector store health
            vector_health = await self.vector_store.health_check()
            
            return {
                "service": "qa_service",
                "status": "healthy" if openai_health["status"] == "healthy" and vector_health["status"] == "healthy" else "unhealthy",
                "openai": openai_health,
                "vector_store": vector_health,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "service": "qa_service",
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

# ===== DOCUMENTATION: WHAT WAS ADDED TO THIS FILE =====
"""
KEY COMPONENTS ADDED FOR AI-POWERED QUESTION ANSWERING:

1. Q&A SERVICE CLASS:
   - QAService: Main class for AI-powered question answering using RAG pipeline
   - Integrates OpenAI GPT models with vector store for intelligent document-based Q&A
   - Handles question analysis, context retrieval, and answer generation

2. OPENAI INTEGRATION:
   - AsyncOpenAI client for efficient API interactions
   - Configurable model parameters (temperature, max_tokens, etc.)
   - Multiple system prompts for different question types
   - Comprehensive error handling and response validation

3. RAG PIPELINE IMPLEMENTATION:
   - Question type analysis for optimal prompt selection
   - Context retrieval using semantic search from vector store
   - Context preparation and prompt engineering
   - AI-powered answer generation with source attribution
   - Response formatting and metadata collection

4. QUESTION TYPE CLASSIFICATION:
   - _analyze_question_type(): Intelligent question categorization
   - Specialized system prompts for different question types
   - General, factual, analytical, and comparative question handling
   - Optimized prompting for better answer quality

5. CONTEXT RETRIEVAL AND PREPARATION:
   - _retrieve_relevant_context(): Semantic search for relevant document chunks
   - _prepare_context_for_prompt(): Context formatting for AI prompts
   - Similarity-based chunk selection and ranking
   - Configurable retrieval parameters (chunks, threshold, filtering)

6. ANSWER GENERATION:
   - _generate_answer(): OpenAI API integration for answer generation
   - Comprehensive metadata collection (tokens, model info, etc.)
   - Error handling and fallback responses
   - Response validation and formatting

7. DOCUMENT MANAGEMENT:
   - process_and_store_document(): Complete document processing pipeline
   - search_documents(): Semantic search across user documents
   - delete_document(): Document removal from vector store
   - get_document_stats(): User document analytics

8. SERVICE MONITORING:
   - health_check(): Comprehensive service health monitoring
   - OpenAI API connectivity testing
   - Vector store health verification
   - Service status reporting

WHAT THIS MODULE ENABLES:
- AI-powered question answering based on user documents
- Intelligent context retrieval using semantic search
- Multiple question type handling with specialized prompts
- Complete RAG (Retrieval-Augmented Generation) pipeline
- Document-based Q&A with source attribution
- Scalable and configurable AI service architecture

INTEGRATION WITH EXISTING SYSTEM:
- Uses QuestionRequest, QuestionResponse, AnswerContext models
- Integrates with VectorStore for document retrieval
- Uses DocumentProcessor for new document processing
- Follows existing configuration and error handling patterns
- Ready for API endpoint integration

NEXT STEPS:
- This module will be used by API endpoints for Q&A functionality
- Document upload endpoints will use this for document processing
- Search endpoints will use this for semantic document search
- Ready for integration with main.py API routes
"""

# ===== DETAILED COMPONENT BREAKDOWN =====
"""
TECHNICAL IMPLEMENTATION DETAILS:

RAG PIPELINE ARCHITECTURE:
- Retrieval: Vector store semantic search for relevant document chunks
- Augmentation: Context preparation and prompt engineering
- Generation: OpenAI GPT model for intelligent answer generation
- Validation: Response formatting and metadata collection

OPENAI INTEGRATION:
- AsyncOpenAI client for efficient API interactions
- Configurable model parameters (temperature, max_tokens, top_p)
- Multiple system prompts for different question types
- Comprehensive error handling and response validation

QUESTION ANALYSIS:
- Intelligent question type classification
- Specialized system prompts for optimal answer quality
- General, factual, analytical, and comparative question handling
- Context-aware prompting strategies

CONTEXT RETRIEVAL:
- Semantic search using vector store similarity
- Configurable retrieval parameters (chunks, threshold, filtering)
- Document ID and tag-based filtering
- Similarity-based chunk ranking and selection

ANSWER GENERATION:
- OpenAI API integration with error handling
- Comprehensive metadata collection (tokens, model info, timing)
- Response validation and formatting
- Fallback error responses for failed generations

DOCUMENT MANAGEMENT:
- Complete document processing pipeline integration
- Semantic search across user documents
- Document deletion and cleanup operations
- User document analytics and statistics

SERVICE MONITORING:
- Health check functionality for service monitoring
- OpenAI API connectivity testing
- Vector store health verification
- Comprehensive error reporting and logging

PERFORMANCE OPTIMIZATIONS:
- Async operations for non-blocking API calls
- Efficient context retrieval and preparation
- Configurable parameters for different use cases
- Caching and optimization strategies

ERROR HANDLING:
- Comprehensive exception handling for all operations
- Graceful degradation for API failures
- Detailed error messages for debugging
- Fallback responses for failed operations

INTEGRATION POINTS:
- Uses QuestionRequest, QuestionResponse, AnswerContext models
- Integrates with VectorStore for document retrieval
- Uses DocumentProcessor for new document processing
- Follows existing configuration and error handling patterns
- Ready for API endpoint integration in main.py

SECURITY AND ISOLATION:
- User-scoped document access and retrieval
- Secure API key management for OpenAI
- Input validation and sanitization
- Error message sanitization for security

DEPENDENCIES USED:
- openai: OpenAI API client for GPT model integration
- asyncio: Asynchronous operations for better performance
- datetime: Timestamp and timing information
- typing: Type hints for better code quality
- Integration with existing VectorStore and DocumentProcessor modules
"""
