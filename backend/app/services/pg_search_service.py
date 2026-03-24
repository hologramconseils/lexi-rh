import re
from flask import current_app
from sqlalchemy import text
from app.models import db


class DocumentChunk(db.Model):
    """Stores chunked document content for full-text search."""
    __tablename__ = 'document_chunks'

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False)
    chunk_index = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)

    document = db.relationship('Document', backref=db.backref('chunks', cascade='all, delete-orphan', lazy='dynamic'))


class PgSearchService:
    """Full-text search using Postgres to_tsvector/to_tsquery or SQLite fallback."""

    def index_document(self, doc_id, title, doc_type, content):
        """Split content into chunks and store them for search."""
        chunk_size = 1500

        # Normalization
        # 1. Remove hyphens at line breaks (e.g. "prépara- tion" -> "préparation")
        content = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', content)
        # 2. Replace newlines with spaces (unless it's a paragraph break)
        content = re.sub(r'(?<!\n)\n(?!\n)', ' ', content)
        # 3. Collapse multiple spaces
        content = re.sub(r' +', ' ', content)
        # 4. Collapse multiple paragraph breaks
        content = re.sub(r'\n\n+', '\n\n', content)

        # Split into blocks at paragraph or sentence boundaries
        blocks = re.split(r'\n\n|(?<=[.!?])\s+(?=[A-Z0-9])', content)

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

        try:
            # Delete old chunks
            DocumentChunk.query.filter_by(document_id=doc_id).delete()
            
            for idx, chunk in enumerate(chunks):
                doc_chunk = DocumentChunk(
                    document_id=doc_id,
                    chunk_index=idx,
                    content=chunk
                )
                db.session.add(doc_chunk)

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Indexing error for doc {doc_id}: {e}")
            raise e

    def delete_document(self, doc_id):
        """Delete all chunks for a document."""
        DocumentChunk.query.filter_by(document_id=doc_id).delete()
        db.session.commit()

    def search(self, query_text):
        """Full-text search with dialect detection (Postgres/SQLite)."""
        if not query_text or not query_text.strip():
            return []

        dialect = db.engine.name
        
        if dialect == 'postgresql':
            return self._search_postgres(query_text)
        else:
            return self._search_sqlite(query_text)

    def _search_postgres(self, query_text):
        """Full-text search using Postgres searching both title and content."""
        # websearch_to_tsquery for user-friendly query parsing
        # setweight('A') for title, 'B' for content to prioritize title matches
        sql = text("""
            SELECT 
                dc.document_id,
                d.title,
                d.document_type,
                dc.content,
                ts_rank(
                    setweight(to_tsvector('french', d.title), 'A') || 
                    setweight(to_tsvector('french', dc.content), 'B'), 
                    websearch_to_tsquery('french', :query)
                ) AS score,
                ts_headline('french', dc.content, websearch_to_tsquery('french', :query),
                    'StartSel=<mark>, StopSel=</mark>, MaxFragments=0, MaxWords=100, MinWords=40, ShortWord=3'
                ) AS highlight
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE 
                (to_tsvector('french', d.title) || to_tsvector('french', dc.content)) @@ websearch_to_tsquery('french', :query)
            ORDER BY score DESC
            LIMIT 15
        """)

        try:
            result = db.session.execute(sql, {'query': query_text})
            return self._format_results(result.fetchall())
        except Exception as e:
            current_app.logger.error(f"PG Search Error: {e}")
            return []

    def _search_sqlite(self, query_text):
        """Fallback search for SQLite using LIKE (no highlighting natively)."""
        # Since SQLite lacks native French TS, we use a simpler approach for local dev
        search_pattern = f"%{query_text}%"
        sql = text("""
            SELECT 
                dc.document_id,
                d.title,
                d.document_type,
                dc.content,
                1.0 as score,
                dc.content as highlight
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.content LIKE :query OR d.title LIKE :query
            LIMIT 15
        """)

        try:
            result = db.session.execute(sql, {'query': search_pattern})
            return self._format_results(result.fetchall())
        except Exception as e:
            current_app.logger.error(f"SQLite Search Error: {e}")
            return []

    def _format_results(self, rows):
        hits = []
        for row in rows:
            highlight_content = row.highlight
            
            # Post-process highlight to ensure full sentences
            # We look for the highlight in the original content to expand it
            if '<mark>' in highlight_content:
                highlight_content = self._expand_to_full_sentences(highlight_content, row.content)

            hits.append({
                '_source': {
                    'document_id': row.document_id,
                    'title': row.title,
                    'document_type': row.document_type,
                    'content': row.content,
                },
                '_score': float(row.score),
                'highlight': {
                    'content': [highlight_content]
                }
            })
        return hits

    def _expand_to_full_sentences(self, highlight, full_content):
        """Expands the highlight snippet to the nearest full sentence boundaries."""
        # Remove markers to find the raw text in the content
        raw_snippet = highlight.replace('<mark>', '').replace('</mark>', '')
        
        # Find the snippet in the full content
        start_idx = full_content.find(raw_snippet)
        if start_idx == -1:
            return highlight # Fallback if not found

        end_idx = start_idx + len(raw_snippet)

        # Expand backwards to start of sentence
        # Look for [.!?] followed by space or start of string
        search_start = full_content[:start_idx][::-1]
        match_start = re.search(r'[.!?]\s', search_start)
        if match_start:
            new_start = start_idx - match_start.start()
        else:
            new_start = 0

        # Expand forwards to end of sentence
        search_end = full_content[end_idx:]
        match_end = re.search(r'[.!?](\s|$)', search_end)
        if match_end:
            new_end = end_idx + match_end.end()
        else:
            new_end = len(full_content)

        expanded_raw = full_content[new_start:new_end].strip()
        
        # Now re-insert the marks by finding keywords from the original highlight
        # This is tricky because ts_headline might have done stemming.
        # However, ts_headline with <mark> usually marks the original words.
        
        # Simple approach: if the expanded text contains the original marks, we are good.
        # But it doesn't. We need to re-apply marking.
        # Actually, if we just use the original highlight but "padded" with the context 
        # from the full_content, it's easier.
        
        prefix = full_content[new_start:start_idx]
        suffix = full_content[end_idx:new_end]
        
        return (prefix + highlight + suffix).strip()


pg_search_service = PgSearchService()
