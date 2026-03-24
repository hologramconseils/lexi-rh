from app import create_app
from app.models import db
from app.models.user import User

app = create_app()
with app.app_context():
    if not User.query.filter_by(email='admin@lexi-rh.com').first():
        admin = User(email='admin@lexi-rh.com', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        
    if not User.query.filter_by(email='salarie@lexi-rh.com').first():
        salarie = User(email='salarie@lexi-rh.com', role='employee')
        salarie.set_password('salarie123')
        db.session.add(salarie)
        
    db.session.commit()
    print("Test users created.")
