import os
from sqlalchemy import text
from app import create_app, db

def migrate():
    app = create_app()
    with app.app_context():
        engine = db.engine
        print(f"Migrating database: {engine.url.database}")
        
        with engine.connect() as conn:
            # 1. Add workspace_id to users
            try:
                print("Adding workspace_id to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id)"))
                conn.commit()
                print("   - OK")
            except Exception as e:
                print(f"   - users.workspace_id already exists or error: {e}")
                conn.rollback()

            # 2. Add workspace_id to documents
            try:
                print("Adding workspace_id to documents table...")
                conn.execute(text("ALTER TABLE documents ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id)"))
                conn.commit()
                print("   - OK")
            except Exception as e:
                print(f"   - documents.workspace_id already exists or error: {e}")
                conn.rollback()
                
            # 3. Add uploaded_by to documents (if missing)
            try:
                print("Adding uploaded_by to documents table...")
                conn.execute(text("ALTER TABLE documents ADD COLUMN uploaded_by INTEGER REFERENCES users(id)"))
                conn.commit()
                print("   - OK")
            except Exception as e:
                print(f"   - documents.uploaded_by already exists or error: {e}")
                conn.rollback()

        print("Migration complete. Tables conversations and messages will be created by db.create_all() on next startup.")

if __name__ == "__main__":
    migrate()
