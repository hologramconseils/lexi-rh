import sys
import os
import pytest
import json

# Add backend root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db
from app.models.user import User

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_register_and_login(client):
    # Test registration
    resp = client.post('/api/auth/register', json={
        'email': 'test_user@example.com',
        'password': 'password123',
        'role': 'admin'
    })
    assert resp.status_code == 201
    data = json.loads(resp.data)
    assert data['message'] == 'User created successfully'
    assert data['user']['email'] == 'test_user@example.com'

    # Test duplicate registration
    resp = client.post('/api/auth/register', json={
        'email': 'test_user@example.com',
        'password': 'password123'
    })
    assert resp.status_code == 400
    data = json.loads(resp.data)
    assert data['error'] == 'Email already exists'

    # Test login
    resp = client.post('/api/auth/login', json={
        'email': 'test_user@example.com',
        'password': 'password123'
    })
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert 'token' in data
    assert data['user']['email'] == 'test_user@example.com'

    # Test invalid login
    resp = client.post('/api/auth/login', json={
        'email': 'test_user@example.com',
        'password': 'wrongpassword'
    })
    assert resp.status_code == 401
    data = json.loads(resp.data)
    assert data['error'] == 'Invalid credentials'

def test_reset_password(client):
    # Register user
    client.post('/api/auth/register', json={
        'email': 'reset_user@example.com',
        'password': 'oldpassword'
    })

    # Reset password
    resp = client.post('/api/auth/reset-password', json={
        'email': 'reset_user@example.com',
        'new_password': 'newpassword'
    })
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data['message'] == 'Mot de passe mis à jour avec succès'

    # Login with new password
    resp = client.post('/api/auth/login', json={
        'email': 'reset_user@example.com',
        'password': 'newpassword'
    })
    assert resp.status_code == 200

    # Try reset non-existent user
    resp = client.post('/api/auth/reset-password', json={
        'email': 'nonexistent@example.com',
        'new_password': 'any'
    })
    assert resp.status_code == 404
