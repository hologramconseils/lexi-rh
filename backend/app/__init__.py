import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify
from flask_cors import CORS
from app.models import db

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})
    
    # Load configuration from environment variables
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret_key')
    database_url = os.getenv('DATABASE_URL', 'sqlite:///lexi_rh.db')
    # Render uses postgres:// but SQLAlchemy requires postgresql://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Resend and Password Reset Configuration
    app.config['RESEND_API_KEY'] = os.getenv('RESEND_API_KEY')
    app.config['MAIL_FROM'] = os.getenv('MAIL_FROM', 'bertrand.saulnerond@hologramconseils.com')
    app.config['FRONTEND_URL'] = os.getenv('FRONTEND_URL', 'http://localhost:5173')

    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    from app.routes import auth, documents, users
    app.register_blueprint(auth.bp)
    app.register_blueprint(documents.bp)
    app.register_blueprint(users.bp)
    
    # Configure logging
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/lexi_rh.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Lexi-RH startup')

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        app.logger.error(f'Server Error: {error}')
        return jsonify({'error': 'Une erreur serveur est survenue. Veuillez réessayer plus tard.'}), 500

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'error': 'Ressource non trouvée.'}), 404

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {"status": "healthy"}, 200

    create_db(app)

    return app

def create_db(app):
    with app.app_context():
        import app.models.user
        import app.models.document
        import app.models.workspace
        from app.services.pg_search_service import DocumentChunk
        db.create_all()
