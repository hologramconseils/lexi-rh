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
        # 1. Enforce space after punctuation if missing (e.g. "loi.Le" -> "loi. Le")
        content = re.sub(r'([.!?])([A-ZÀ-ÖØ-ß])', r'\1 \2', content)
        # 2. Fix stuck words (lowercase followed by uppercase without space, heuristic)
        # e.g. "loiLe" -> "loi Le"
        content = re.sub(r'([a-zà-öø-ÿ])([A-ZÀ-ÖØ-ß])', r'\1 \2', content)

        # 3. Deduplicate consecutive identical sentences (often from PDF OCR artifacts)
        sentences = re.split(r'(?<=[.!?])\s+', content)
        unique_sentences = []
        for s in sentences:
            s_clean = s.strip()
            # Canonicalize for comparison: lower, no period at end, no extra spaces
            canonical = re.sub(r'\s+', ' ', s_clean.lower().rstrip('.'))
            if s_clean and (not unique_sentences or canonical != unique_sentences[-1][1]):
                unique_sentences.append((s, canonical))
        content = " ".join([item[0] for item in unique_sentences])

        # 4. Remove hyphens at line breaks (e.g. "prépara-\ntion" -> "préparation")
        content = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', content)
        # 5. Replace newlines with spaces (unless it's a paragraph break)
        content = re.sub(r'(?<!\n)\n(?!\n)', ' ', content)
        # 6. Collapse multiple horizontal spaces and non-breaking spaces
        content = re.sub(r'[^\S\n]+', ' ', content)
        # 7. Collapse multiple paragraph breaks
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

    def search(self, query_text, workspace_id=None):
        """Full-text search with dialect detection (Postgres/SQLite)."""
        if not query_text or not query_text.strip():
            return []

        dialect = db.engine.name
        
        if dialect == 'postgresql':
            return self._search_postgres(query_text, workspace_id=workspace_id)
        else:
            return self._search_sqlite(query_text, workspace_id=workspace_id)

    def _search_postgres(self, query_text, workspace_id=None):
        """Full-text search using Postgres searching both title and content."""
        # websearch_to_tsquery for user-friendly query parsing
        # setweight('A') for title, 'B' for content to prioritize title matches
        
        workspace_filter = ""
        params = {'query': query_text}
        if workspace_id:
            workspace_filter = "AND d.workspace_id = :workspace_id"
            params['workspace_id'] = workspace_id

        sql = text(f"""
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
                {workspace_filter}
            ORDER BY score DESC
            LIMIT 15
        """)

        try:
            result = db.session.execute(sql, params)
            return self._format_results(result.fetchall())
        except Exception as e:
            current_app.logger.error(f"PG Search Error: {e}")
            return []

    def _search_sqlite(self, query_text, workspace_id=None):
        """Fallback search for SQLite using LIKE (no highlighting natively)."""
        search_pattern = f"%{query_text}%"
        
        workspace_filter = ""
        params = {'query': search_pattern}
        if workspace_id:
            workspace_filter = "AND d.workspace_id = :workspace_id"
            params['workspace_id'] = workspace_id

        sql = text(f"""
            SELECT 
                dc.document_id,
                d.title,
                d.document_type,
                dc.content,
                1.0 as score
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE (dc.content LIKE :query OR d.title LIKE :query)
                  {workspace_filter}
            LIMIT 15
        """)

        try:
            result = db.session.execute(sql, params)
            rows = result.fetchall()
            
            # Simple manual highlighting for SQLite fallback
            hits = []
            for row in rows:
                content = row.content
                match = re.search(re.escape(query_text), content, re.IGNORECASE)
                
                if match:
                    start, end = match.span()
                    highlight = content[start:end]
                    snippet = content[:start] + f"<mark>{highlight}</mark>" + content[end:]
                    highlight_content = self._expand_to_full_sentences(snippet, content)
                else:
                    highlight_content = self._expand_to_full_sentences(content[:200], content)

                hits.append({
                    '_source': {
                        'document_id': row.document_id,
                        'title': row.title,
                        'document_type': row.document_type,
                        'content': row.content,
                    },
                    '_score': 1.0,
                    'highlight': {
                        'content': [highlight_content]
                    }
                })
            return hits
        except Exception as e:
            current_app.logger.error(f"SQLite Search Error: {e}")
            return []

    def suggest(self, query_text, limit=5, workspace_id=None):
        """Get autocomplete suggestions from titles and content."""
        if not query_text or len(query_text.strip()) < 2:
            return []

        dialect = db.engine.name
        
        workspace_filter = ""
        params = {'limit': limit}
        if workspace_id:
            workspace_filter = "AND d.workspace_id = :workspace_id"
            params['workspace_id'] = workspace_id

        if dialect != 'postgresql':
            # Basic fallback for SQLite
            params['pattern'] = f"{query_text}%"
            sql = text(f"SELECT DISTINCT title FROM documents d WHERE title LIKE :pattern {workspace_filter} LIMIT :limit")
            try:
                result = db.session.execute(sql, params)
                return [row[0] for row in result.fetchall()]
            except:
                return []

        # Postgres implementation
        prefix_pattern = f"%{query_text}%"
        clean_query = re.sub(r'[^\w\s]', '', query_text).strip()
        if not clean_query:
            return []
        ts_query = " & ".join(f"{word}:*" for word in clean_query.split())
        
        params.update({
            'prefix_pattern': prefix_pattern, 
            'ts_query': ts_query
        })

        sql = text(f"""
            WITH suggestions AS (
                -- Match in titles
                SELECT 
                    d.title as suggestion,
                    1 as rank_order
                FROM documents d
                WHERE d.title ILIKE :prefix_pattern
                {workspace_filter}
                
                UNION ALL
                
                -- Match in content (extract a short phrase)
                SELECT 
                    ts_headline('french', dc.content, to_tsquery('french', :ts_query),
                        'StartSel="", StopSel="", MaxWords=8, MinWords=3, ShortWord=3'
                    ) as suggestion,
                    2 as rank_order
                FROM document_chunks dc
                JOIN documents d ON d.id = dc.document_id
                WHERE to_tsvector('french', dc.content) @@ to_tsquery('french', :ts_query)
                {workspace_filter}
            )
            SELECT DISTINCT LOWER(suggestion) as suggestion, MIN(rank_order) as min_rank
            FROM suggestions
            WHERE suggestion IS NOT NULL AND length(suggestion) > 3 AND suggestion !~ '^\\s*$'
            GROUP BY LOWER(suggestion)
            ORDER BY min_rank ASC, LOWER(suggestion) ASC
            LIMIT :limit
        """)

        try:
            result = db.session.execute(sql, params)
            
            suggestions = []
            for row in result.fetchall():
                s = row[0].replace('...', '').strip()
                if s:
                    s = s[0].upper() + s[1:]
                    suggestions.append(s)
                    
            return suggestions[:limit]
        except Exception as e:
            current_app.logger.error(f"Suggest Error: {e}")
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
        # 1. Strip markers to find the raw text position in full_content
        raw_snippet = highlight.replace('<mark>', '').replace('</mark>', '')
        
        # 2. Find the snippet in the full content
        start_in_full = full_content.find(raw_snippet)
        if start_in_full == -1:
            # Fallback for ts_headline transformations
            return highlight

        # 3. Expand backwards to the start of the sentence
        prefix_part = full_content[:start_in_full]
        # Match start of sentence (after .!? followed by space, or start of string)
        # and checking for a capital/digit as starting char
        match_start = list(re.finditer(r'(?:[.!?]\s+|^)(?=[A-Z0-9À-ÖØ-ß])', prefix_part))
        new_start = match_start[-1].end() if match_start else 0

        # 4. Expand forwards to the end of the sentence
        suffix_part = full_content[start_in_full + len(raw_snippet):]
        # Match end of sentence (.!? followed by empty space or end of string)
        match_end = re.search(r'[.!?](?:\s+|$)', suffix_part)
        new_end = start_in_full + len(raw_snippet) + match_end.end() if match_end else len(full_content)

        # 5. Build result by wrapping the original highlight (with its markers)
        # with the leading and trailing context from the full_content
        context_before = full_content[new_start:start_in_full]
        context_after = full_content[start_in_full + len(raw_snippet):new_end]
        
        result = (context_before + highlight + context_after).strip()
        
        # Add termination period if missing for long snippets
        if result and result[-1] not in '.!?':
             if len(result) > 60:
                 result += "."
                 
        return result


pg_search_service = PgSearchService()
