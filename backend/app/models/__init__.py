from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import models here to ensure they are registered
from app.models.workspace import Workspace
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation, Message
