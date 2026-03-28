from flask import Blueprint, request, jsonify
from app.models import db
from app.models.conversation import Conversation, Message
from app.models.workspace import Workspace
from app.utils.auth import token_required
from app.services.pg_search_service import pg_search_service

bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@bp.route('/ask', methods=['POST'])
@token_required
def ask_question(current_user):
    """Perform a verbatim document search and store history."""
    data = request.get_json()
    if not data or not data.get('question'):
        return jsonify({'error': 'Recherche requise.'}), 400
        
    query = data['question']
    conv_id = data.get('conversation_id')
    
    # 1. Get/Create search session (history)
    if not current_user.workspace_id:
        # Fallback for un-migrated users: try to find a workspace or create a generic one
        # This prevents 500 IntegrityError on Conversation table
        ws = Workspace.query.filter(Workspace.name.ilike("%Administration%")).first()
        if not ws:
            ws = Workspace(name="Espace par défaut")
            db.session.add(ws)
            db.session.flush()
        current_user.workspace_id = ws.id
        db.session.commit()

    if conv_id:
        conversation = Conversation.query.filter_by(id=conv_id, user_id=current_user.id).first_or_404()
    else:
        title = query[:50] + "..." if len(query) > 50 else query
        conversation = Conversation(
            user_id=current_user.id,
            workspace_id=current_user.workspace_id,
            title=title
        )
        db.session.add(conversation)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Erreur lors de la création de la session de recherche.'}), 500
        
    # 2. Store user search query in history
    user_msg = Message(conversation_id=conversation.id, content=query, is_user=True)
    db.session.add(user_msg)
    
    # 3. VERBATIM SEARCH (Strict PRD Compliance)
    # No AI synthesis. Directly search the workspace index.
    search_results = pg_search_service.search(query, workspace_id=current_user.workspace_id)
    
    # 4. Format extractions
    formatted_extractions = []
    for hit in search_results:
        source = hit['_source']
        # Highlights from pg_search_service are verbatim extracts
        highlights = hit.get('highlight', {}).get('content', [])
        formatted_extractions.append({
            'document_id': source.get('document_id'),
            'title': source.get('title'),
            'type': source.get('document_type'),
            'extracts': highlights
        })
        
    # 5. For search history, we store a summary or the top result snippet?
    # The PRD says "aucune reformulation". We'll just provide the data on GET.
    # In history, the "message" from "AI" is just a set of results.
    # We'll store a simple confirm message for the DB, but return results.
    result_summary = f"{len(formatted_extractions)} extrait(s) trouvé(s)."
    ai_msg = Message(conversation_id=conversation.id, content=result_summary, is_user=False)
    db.session.add(ai_msg)
    db.session.commit()
    
    return jsonify({
        'conversation_id': conversation.id,
        'query': query,
        'results': formatted_extractions
    }), 200

@bp.route('/conversations', methods=['GET'])
@token_required
def list_conversations(current_user):
    """List recent searches."""
    sessions = Conversation.query.filter_by(
        user_id=current_user.id, 
        workspace_id=current_user.workspace_id
    ).order_by(Conversation.created_at.desc()).all()
    
    return jsonify([s.to_dict() for s in sessions]), 200

@bp.route('/conversations/<int:conv_id>', methods=['GET'])
@token_required
def get_conversation(current_user, conv_id):
    """Retrieve search session details."""
    conversation = Conversation.query.filter_by(
        id=conv_id, 
        user_id=current_user.id, 
        workspace_id=current_user.workspace_id
    ).first_or_404()
    
    messages = Message.query.filter_by(conversation_id=conversation.id).order_by(Message.timestamp.asc()).all()
    
    return jsonify({
        'session': conversation.to_dict(),
        'history': [m.to_dict() for m in messages]
    }), 200
