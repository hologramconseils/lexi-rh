from app import create_app, db
from app.models.document import Document
from app.services.pg_search_service import pg_search_service, DocumentChunk

def reindex_all():
    app = create_app()
    with app.app_context():
        print("Fetching all documents from PostgreSQL...")
        docs = Document.query.all()
        
        # Clear existing chunks
        try:
            num_deleted = DocumentChunk.query.delete()
            db.session.commit()
            print(f"Cleared {num_deleted} existing chunks from database.")
        except Exception as e:
            print(f"Error clearing chunks: {e}")
            db.session.rollback()
            
        print(f"Found {len(docs)} documents. Re-indexing...")
        for doc in docs:
            print(f" -> Indexing {doc.title} (ID: {doc.id}) with the new chunking algorithm...")
            try:
                pg_search_service.index_document(
                    doc_id=doc.id,
                    title=doc.title,
                    doc_type=doc.document_type,
                    content=doc.content_text
                )
            except Exception as e:
                print(f"Failed to index {doc.title}: {e}")
                
        print("Reindexing complete!")

if __name__ == "__main__":
    reindex_all()
