import secrets
import hashlib
import requests
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from app.models import db
from app.models.user import User, PasswordResetToken
from app.utils.auth import generate_token, token_required

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def send_reset_email(to_email, reset_link):
    """Sends a password reset email via Resend API."""
    api_key = current_app.config.get('RESEND_API_KEY')
    from_email = current_app.config.get('MAIL_FROM')
    
    if not api_key:
        current_app.logger.error("RESEND_API_KEY is not set. Email not sent.")
        return False
        
    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "from": f"Lexi-RH <{from_email}>",
                "to": [to_email],
                "subject": "Réinitialisation de votre mot de passe - Lexi-RH",
                "html": f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Réinitialisation de mot de passe</h2>
                    <p>Bonjour,</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Lexi-RH.</p>
                    <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expire dans 1 heure.</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe</a>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">Si vous n'avez pas demandé cette modification, vous pouvez ignorer cet email en toute sécurité.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; 2024 Lexi-RH</p>
                </div>
                """
            }
        )
        if response.status_code != 200 and response.status_code != 201:
            current_app.logger.error(f"Resend API error: {response.text}")
            return False
        return True
    except Exception as e:
        current_app.logger.error(f"Error sending email: {str(e)}")
        return False

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
        
    token = generate_token(user.id, user.role)
    return jsonify({
        'token': token,
        'user': user.to_dict()
    })

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
        
    role = data.get('role', 'employee')
    if role not in ['employee', 'employer', 'admin']:
        role = 'employee'
        
    new_user = User(email=data['email'], role=role)
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully', 'user': new_user.to_dict()}), 201

@bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({'user': current_user.to_dict()})

@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({'error': 'Email requis'}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    # Always return 200 for security reasons even if user doesn't exist
    if not user:
        return jsonify({'message': 'Si cet email correspond à un compte, un lien de réinitialisation vous sera envoyé.'}), 200
        
    # Generate token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Save token
    expires_at = datetime.utcnow() + timedelta(hours=1)
    reset_token = PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    db.session.add(reset_token)
    db.session.commit()
    
    # Send email
    reset_link = f"{current_app.config['FRONTEND_URL']}/reset-password?token={token}"
    if send_reset_email(user.email, reset_link):
        return jsonify({'message': 'Lien de réinitialisation envoyé avec succès par email.'}), 200
    else:
        return jsonify({'error': "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard."}), 500

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    if not data or not data.get('token') or not data.get('new_password'):
        return jsonify({'error': 'Données incorrectes'}), 400
        
    token_hash = hashlib.sha256(data['token'].encode()).hexdigest()
    reset_token = PasswordResetToken.query.filter_by(token_hash=token_hash).first()
    
    if not reset_token or reset_token.used or reset_token.expires_at < datetime.utcnow():
        return jsonify({'error': 'Lien invalide ou expiré'}), 400
        
    user = User.query.get(reset_token.user_id)
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404
        
    user.set_password(data['new_password'])
    reset_token.used = True
    db.session.commit()
    
    return jsonify({'message': 'Votre mot de passe a été réinitialisé avec succès.'}), 200
