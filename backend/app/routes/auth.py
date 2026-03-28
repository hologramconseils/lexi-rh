import secrets
import hashlib
import requests
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from app.models import db
from app.models.user import User, PasswordResetToken
from app.models.workspace import Workspace
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
    
    # Create workspace for employer
    if role == 'employer':
        workspace_name = data.get('workspace_name', f"Espace {data['email']}")
        new_workspace = Workspace(name=workspace_name)
        db.session.add(new_workspace)
        db.session.flush() # Get the ID before committing
        new_user.workspace_id = new_workspace.id
        
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
        
    email = data['email']
    current_app.logger.info(f"Forgot password request for email: {email}")
    user = User.query.filter_by(email=email).first()
    
    # Generate token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    if user:
        current_app.logger.info(f"User found: {user.id}. Creating reset token.")
        # Store token
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.session.add(reset_token)
        db.session.commit()
        current_app.logger.info(f"Reset token stored. Hash: {token_hash[:10]}...")

        # Send email
        reset_url = f"{current_app.config['FRONTEND_URL']}/reset-password?token={token}"
        current_app.logger.info(f"Attempting to send email with URL: {reset_url}")
        
        email_sent = False
        if current_app.config.get('RESEND_API_KEY'):
            res = send_reset_email(
                to_email=email,
                reset_link=reset_url
            )
            if res:
                email_sent = True
                current_app.logger.info("Email sent successfully via Resend.")
            else:
                current_app.logger.error("Failed to send email via Resend.")
        else:
            current_app.logger.warning("RESEND_API_KEY not set. Email not sent.")
            # For development, log the URL so it can be used manually
            current_app.logger.info(f"DEVELOPMENT MODE - Password Reset URL: {reset_url}")
    else:
        current_app.logger.warning(f"User with email {email} not found. Returning generic success.")

    return jsonify({"message": "Si votre adresse email est dans notre base, vous recevrez un lien de réinitialisation."}), 200

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    if not data or 'token' not in data or 'new_password' not in data:
        current_app.logger.warning("Reset password failed: Missing token or password in request.")
        return jsonify({"error": "Données incorrectes"}), 400

    token_hash = hashlib.sha256(data['token'].encode()).hexdigest()
    current_app.logger.info(f"Reset password attempt with token hash start: {token_hash[:10]}...")
    
    reset_token = PasswordResetToken.query.filter_by(token_hash=token_hash).first()
    
    if not reset_token:
        current_app.logger.warning(f"Reset password failed: Token hash not found in DB.")
        return jsonify({"error": "Lien invalide ou expiré"}), 400
        
    if reset_token.used:
        current_app.logger.warning(f"Reset password failed: Token already used.")
        return jsonify({"error": "Lien déjà utilisé"}), 400
        
    if reset_token.expires_at < datetime.utcnow():
        current_app.logger.warning(f"Reset password failed: Token expired at {reset_token.expires_at}.")
        return jsonify({"error": "Lien expiré"}), 400

    user = User.query.get(reset_token.user_id)
    if not user:
        current_app.logger.error(f"Reset password failed: User {reset_token.user_id} not found for valid token.")
        return jsonify({"error": "Utilisateur introuvable"}), 404

    current_app.logger.info(f"Resetting password for user: {user.email}")
    user.set_password(data['new_password'])
    reset_token.used = True
    db.session.commit()
    current_app.logger.info(f"Password reset successful for user: {user.email}")

    return jsonify({"message": "Mot de passe réinitialisé avec succès"}), 200
