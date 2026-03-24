from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from app.models import db
from app.models.document import Document
from app.utils.auth import token_required, admin_required
from app.services.pg_search_service import pg_search_service
import fitz  # PyMuPDF
import io

bp = Blueprint('documents', __name__, url_prefix='/api/documents')

def extract_text_from_pdf(file_stream):
    doc = fitz.open(stream=file_stream.read(), filetype="pdf")
    text_blocks = []
    for page in doc:
        # "blocks" is better for flow than "text"
        blocks = page.get_text("blocks")
        for b in blocks:
            if b[4].strip():
                # b[4] is the text content of the block
                clean_block = b[4].replace('\n', ' ').strip()
                text_blocks.append(clean_block)
    
    full_text = "\n\n".join(text_blocks)
    return full_text

@bp.route('/', methods=['POST'])
@admin_required
def upload_document(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    title = request.form.get('title', file.filename)
    doc_type = request.form.get('document_type', 'Autre')
    
    filename = secure_filename(file.filename)
    content_text = ""
    
    try:
        file_bytes = file.read()
        if filename.lower().endswith('.pdf'):
            content_text = extract_text_from_pdf(io.BytesIO(file_bytes))
        elif filename.lower().endswith('.txt'):
            content_text = file_bytes.decode('utf-8')
        else:
            return jsonify({'error': 'Unsupported file type. Use PDF or TXT.'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to parse file: {str(e)}'}), 500

    if not content_text.strip():
        return jsonify({'error': 'Extracted text is empty. Cannot index.'}), 400

    # Save to Postgres
    new_doc = Document(
        title=title,
        document_type=doc_type,
        content_text=content_text,
        uploaded_by=current_user.id
    )
    db.session.add(new_doc)
    db.session.commit()
    
    # Index to Postgres
    try:
        pg_search_service.index_document(
            doc_id=new_doc.id, 
            title=title, 
            doc_type=doc_type, 
            content=content_text
        )
    except Exception as e:
        from flask import current_app
        current_app.logger.error(f"Failed to index document {new_doc.id} ({title}): {e}")
        
    return jsonify({'message': 'Document uploaded and indexed', 'document': new_doc.to_dict()}), 201

@bp.route('/', methods=['GET'])
@token_required
def list_documents(current_user):
    docs = Document.query.order_by(Document.uploaded_at.desc()).all()
    return jsonify([d.to_dict() for d in docs])

@bp.route('/<int:doc_id>', methods=['DELETE'])
@admin_required
def delete_document(current_user, doc_id):
    doc = Document.query.get_or_404(doc_id)
    
    pg_search_service.delete_document(doc_id)
    
    db.session.delete(doc)
    db.session.commit()
    
    return jsonify({'message': 'Document deleted successfully'})

@bp.route('/search', methods=['GET'])
def search_documents():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
        
    results = pg_search_service.search(query)
    formatted_results = []
    for hit in results:
        source = hit['_source']
        highlights = hit.get('highlight', {}).get('content', [])
        formatted_results.append({
            'document_id': source.get('document_id'),
            'title': source.get('title'),
            'type': source.get('document_type'),
            'score': hit['_score'],
            'highlights': highlights
        })
    return jsonify(formatted_results)

@bp.route('/reindex', methods=['POST'])
@admin_required
def trigger_reindex(current_user):
    from reindex_all import reindex_all
    try:
        reindex_all()
        return jsonify({'message': 'Reindex completed successfully'}), 200
    except Exception as e:
        from flask import current_app
        current_app.logger.error(f"Manual reindex failed: {e}")
        return jsonify({'error': f'Reindex failed: {str(e)}'}), 500
