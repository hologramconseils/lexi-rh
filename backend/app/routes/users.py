from flask import Blueprint, request, jsonify
from app.models import db
from app.models.user import User
from app.utils.auth import token_required

bp = Blueprint('users', __name__, url_prefix='/api/users')

@bp.route('/me', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    if 'email' in data and data['email'] != current_user.email:
        existing = User.query.filter_by(email=data['email']).first()
        if existing:
            return jsonify({'error': 'Email already in use'}), 400
        current_user.email = data['email']
        
    if 'password' in data and data['password']:
        current_user.set_password(data['password'])
        
    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': current_user.to_dict()})
