from app import create_app, db
from app.models.document import Document
from app.services.elasticsearch_service import es_service

def reindex_all():
    app = create_app()
    with app.app_context():
        print("Fetching all documents from PostgreSQL...")
        docs = Document.query.all()
        
        # Delete existing index safely
        try:
            if es_service.es.indices.exists(index=es_service.index_name):
                es_service.es.indices.delete(index=es_service.index_name)
                print(f"Deleted old ES index: {es_service.index_name}")
        except Exception as e:
            print(f"Error deleting index: {e}")
            
        print(f"Found {len(docs)} documents. Re-indexing...")
        for doc in docs:
            print(f" -> Indexing {doc.title} (ID: {doc.id}) with the new chunking algorithm...")
            es_service.index_document(
                doc_id=doc.id,
                title=doc.title,
                doc_type=doc.document_type,
                content=doc.content_text
            )
        print("Reindexing complete!")

if __name__ == "__main__":
    reindex_all()
