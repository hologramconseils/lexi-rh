import os
from elasticsearch import Elasticsearch

class ESService:
    def __init__(self):
        self._es = None
        self.index_name = "legal_documents"

    @property
    def es(self):
        if self._es is None:
            es_host = os.environ.get('ELASTICSEARCH_URL', 'http://localhost:9200')
            self._es = Elasticsearch([es_host])
            try:
                if not self._es.indices.exists(index=self.index_name):
                    self._es.indices.create(index=self.index_name, body={
                        "mappings": {
                            "properties": {
                                "document_id": {"type": "integer"},
                                "title": {"type": "text", "analyzer": "french"},
                                "document_type": {"type": "keyword"},
                                "content": {"type": "text", "analyzer": "french"},
                                "chunk_index": {"type": "integer"}
                            }
                        }
                    })
            except Exception as e:
                print(f"ES Init Error: {e}")
        return self._es

    def index_document(self, doc_id, title, doc_type, content):
        import re
        chunk_size = 1500
        
        # 1. Clean up weird PDF newlines. If a newline is NOT preceded by punctuation, replace with space.
        # This joins broken sentences effectively.
        content = re.sub(r'(?<![.!?/:;-])\n+(?=[a-z])', ' ', content)
        
        # 2. Split into logical blocks (sentences or paragraphs)
        # Split by newlines, or sentence-ending punctuation followed by space and Uppercase letter.
        blocks = re.split(r'\n\s*\n|(?<=[.!?])\s+(?=[A-Z0-9])', content)
        
        chunks = []
        current_chunk = ""
        
        for block in blocks:
            block = block.strip()
            if not block:
                continue
                
            if len(current_chunk) + len(block) < chunk_size:
                current_chunk += block + " "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = block + " "
                
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        for idx, chunk in enumerate(chunks):
            doc = {
                "document_id": doc_id,
                "title": title,
                "document_type": doc_type,
                "content": chunk,
                "chunk_index": idx
            }
            try:
                self.es.index(index=self.index_name, document=doc)
            except Exception as e:
                print(f"ES Index Error: {e}")

    def delete_document(self, doc_id):
        query = {
            "query": {
                "match": {
                    "document_id": doc_id
                }
            }
        }
        try:
            self.es.delete_by_query(index=self.index_name, body=query)
        except Exception as e:
            print(f"ES Delete Error: {e}")

    def search(self, query_text):
        query = {
            "query": {
                "match": {
                    "content": query_text
                }
            },
            "highlight": {
                "fields": {
                    "content": {
                        "pre_tags": ["<mark>"], 
                        "post_tags": ["</mark>"],
                        "number_of_fragments": 0
                    }
                }
            }
        }
        try:
            res = self.es.search(index=self.index_name, body=query, size=5)
            return [hit for hit in res['hits']['hits']]
        except Exception as e:
            print(f"ES Search Error: {e}")
            return []

es_service = ESService()
