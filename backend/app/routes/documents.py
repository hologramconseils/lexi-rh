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
    # ... (existing extract_text_from_pdf logic)
    doc = fitz.open(stream=file_stream.read(), filetype="pdf")
    text_blocks = []
    for page in doc:
        blocks = page.get_text("blocks")
        for b in blocks:
            text = b[4].strip()
            if text:
                if not text[-1].isspace() and text[-1] not in '.!?,;:':
                    text += " "
                if not text_blocks or text.strip() != text_blocks[-1].strip():
                    text_blocks.append(text)
    full_text = "\n".join(text_blocks)
    return full_text

@bp.route('/', methods=['POST'])
@token_required
def upload_document(current_user):
    if current_user.role not in ['employer', 'admin']:
        return jsonify({'error': 'Permission denied. Only employers and admins can upload resources.'}), 403
        
    if not current_user.workspace_id and current_user.role != 'admin':
        return jsonify({'error': 'User has no associated workspace.'}), 400

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
        uploaded_by=current_user.id,
        workspace_id=current_user.workspace_id
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
    # Filter by workspace_id
    query = Document.query
    if current_user.role != 'admin' or current_user.workspace_id:
        query = query.filter_by(workspace_id=current_user.workspace_id)
        
    docs = query.order_by(Document.uploaded_at.desc()).all()
    return jsonify([d.to_dict() for d in docs])

@bp.route('/<int:doc_id>', methods=['DELETE'])
@token_required
def delete_document(current_user, doc_id):
    doc = Document.query.get_or_404(doc_id)
    
    # Check permission: Only admin or the workspace owner can delete
    if current_user.role != 'admin' and doc.workspace_id != current_user.workspace_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    pg_search_service.delete_document(doc_id)
    
    db.session.delete(doc)
    db.session.commit()
    
    return jsonify({'message': 'Document deleted successfully'})

@bp.route('/search', methods=['GET'])
@token_required
def search_documents(current_user):
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
        
    # Strictly filter by user's workspace_id
    workspace_id = current_user.workspace_id
    if not workspace_id and current_user.role != 'admin':
         return jsonify({'error': 'User has no associated workspace.'}), 400
         
    results = pg_search_service.search(query, workspace_id=workspace_id)
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

@bp.route('/suggest', methods=['GET'])
@token_required
def suggest_documents(current_user):
    query = request.args.get('q', '')
    if not query or len(query.strip()) < 2:
        return jsonify([])
    
    workspace_id = current_user.workspace_id
    if not workspace_id and current_user.role != 'admin':
        return jsonify([])
        
    suggestions = pg_search_service.suggest(query, workspace_id=workspace_id)
    return jsonify(suggestions)

@bp.route('/reindex', methods=['POST'])
@admin_required
def trigger_reindex(current_user):
    # ... (existing trigger_reindex logic)
    from reindex_all import reindex_all
    try:
        reindex_all()
        return jsonify({'message': 'Reindex completed successfully'}), 200
    except Exception as e:
        from flask import current_app
        current_app.logger.error(f"Manual reindex failed: {e}")
        return jsonify({'error': f'Reindex failed: {str(e)}'}), 500
