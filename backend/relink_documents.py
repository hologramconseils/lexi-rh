import os
import sys
from app import create_app
from app.models import db
from app.models.user import User
from app.models.document import Document

def relink_all_documents():
    app = create_app()
    with app.app_context():
        print("--- LEXI-RH DOCUMENT RE-LINKING ---")
        
        # Find the first employer/administrator
        first_admin = User.query.filter_by(role='employer').order_by(User.id.asc()).first()
        if not first_admin:
            print("ERROR: No administrator account found. Please create one on the site first.")
            sys.exit(1)
            
        target_workspace_id = first_admin.workspace_id
        print(f"Targeting Workspace ID: {target_workspace_id} (Admin: {first_admin.email})")
        
        # Count documents to update
        total_docs = Document.query.count()
        if total_docs == 0:
            print("No documents found in the database. Nothing to re-link.")
            return
            
        print(f"Relinking {total_docs} documents...")
        try:
            # Update all documents to the new workspace_id
            num_updated = Document.query.update({Document.workspace_id: target_workspace_id})
            db.session.commit()
            print(f"Successfully re-linked {num_updated} documents to Workspace {target_workspace_id}.")
            print("\nSUCCESS: Documents are now assigned to the first administrator and ready for search.")
        except Exception as e:
            db.session.rollback()
            print(f"ERROR: Re-linking failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    relink_all_documents()
