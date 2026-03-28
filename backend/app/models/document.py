from datetime import datetime
from . import db

class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    document_type = db.Column(db.String(100)) # e.g. Code du travail, Convention, Règlement Intérieur
    content_text = db.Column(db.Text, nullable=False)
    es_index_id = db.Column(db.String(255))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspaces.id'), nullable=True)

    workspace = db.relationship('Workspace', backref=db.backref('documents', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'document_type': self.document_type,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'uploaded_by': self.uploaded_by,
            'workspace_id': self.workspace_id
        }
