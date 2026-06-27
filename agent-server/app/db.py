"""
MongoDB connection using Motor (async).
"""
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Create a module-level, global client.
# Motor manages the connection pool under the hood.
# It doesn't connect until the first query is executed.
client: AsyncIOMotorClient = AsyncIOMotorClient(settings.mongodb_uri)

def get_analyses_collection():
    """Return the analyses collection."""
    # The default database from the URI is used
    return client.get_default_database().get_collection("analyses")
