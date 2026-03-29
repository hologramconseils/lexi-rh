import os
import sys
from app import create_app
from app.models import db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document

def reset_all_users():
    app = create_app()
    with app.app_context():
        print("--- LEXI-RH GLOBAL USER RESET ---")
        
        user_count = User.query.count()
        workspace_count = Workspace.query.count()
        document_count = Document.query.count()
        
        print(f"Current state:")
        print(f" - Users: {user_count}")
        print(f" - Workspaces: {workspace_count}")
        print(f" - Documents: {document_count}")
        
        if user_count == 0:
            print("No users to delete. System is already clean.")
            return

        print("\nDeleting all user accounts...")
        try:
            # Delete all users. Cascading deletion will handle history/tokens.
            num_deleted = User.query.delete()
            db.session.commit()
            print(f"Successfully revoked {num_deleted} user accounts.")
            
            # Final counts
            print("\nFinal state:")
            print(f" - Users: {User.query.count()}")
            print(f" - Workspaces: {Workspace.query.count()} (Preserved)")
            print(f" - Documents: {Document.query.count()} (Preserved)")
            
            print("\nSUCCESS: System reset complete. Ready for new administrator setup.")
        except Exception as e:
            db.session.rollback()
            print(f"ERROR: Reset failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    reset_all_users()
