import os
from flask import Flask
from flask_cors import CORS
from app.models import db

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})
    
    # Load configuration from environment variables
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret_key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///lexi_rh.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    from app.routes import auth, documents, users
    app.register_blueprint(auth.bp)
    app.register_blueprint(documents.bp)
    app.register_blueprint(users.bp)
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {"status": "healthy"}, 200

    create_db(app)

    return app

def create_db(app):
    with app.app_context():
        import app.models.user
        import app.models.document
        db.create_all()
