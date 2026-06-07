"""
MongoDB connection using Motor (async).
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Load URI from environment (config.py handles the main settings validation,
# but we read it directly here to ensure the client is ready immediately).
uri = os.environ.get("MONGODB_URI")
if not uri:
    # Fallback to config if not directly in env
    try:
        from app.config import settings
        uri = settings.mongodb_uri
    except Exception:
        raise ValueError("MONGODB_URI environment variable must be set")

# Create a module-level, global client.
# Motor manages the connection pool under the hood.
# It doesn't connect until the first query is executed.
client: AsyncIOMotorClient = AsyncIOMotorClient(uri)

def get_analyses_collection():
    """Return the analyses collection."""
    # The default database from the URI is used
    return client.get_default_database().get_collection("analyses")
