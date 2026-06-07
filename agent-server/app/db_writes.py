"""
MongoDB write operations for saving analysis results and statuses.
These are called by the background task in Fire-and-Forget mode.
"""
import logging
from datetime import datetime, timezone
from bson.objectid import ObjectId

from app.db import get_analyses_collection

logger = logging.getLogger(__name__)

async def save_analysis_result(analysis_id: str, results: dict) -> None:
    """
    Write completed analysis results to MongoDB and mark status as 'completed'.
    """
    col = get_analyses_collection()
    
    try:
        obj_id = ObjectId(analysis_id)
    except Exception as e:
        logger.error(f"Invalid analysis_id {analysis_id}: {e}")
        return
        
    update = {
        "$set": {
            "status": "completed",
            "results": results,
            "completedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }
    }
    
    try:
        result = await col.update_one({"_id": obj_id}, update)
        if result.matched_count == 0:
            logger.warning(f"Analysis {analysis_id} not found in DB.")
        else:
            logger.info(f"Successfully saved results for analysis {analysis_id}.")
    except Exception as e:
        logger.error(f"Failed to save results for analysis {analysis_id}: {e}")


async def update_analysis_status(analysis_id: str, status: str) -> None:
    """
    Update the processing status of an analysis in MongoDB.
    Used for granular UI updates (e.g., 'analyzing_ats', 'evaluating_impact').
    """
    col = get_analyses_collection()
    
    try:
        obj_id = ObjectId(analysis_id)
    except Exception as e:
        logger.error(f"Invalid analysis_id {analysis_id}: {e}")
        return
        
    update = {
        "$set": {
            "status": status,
            "updatedAt": datetime.now(timezone.utc),
        }
    }
    
    try:
        await col.update_one({"_id": obj_id}, update)
        logger.info(f"Updated status for {analysis_id} to '{status}'.")
    except Exception as e:
        logger.error(f"Failed to update status for {analysis_id}: {e}")


async def mark_analysis_failed(analysis_id: str, error: str) -> None:
    """
    Mark an analysis as failed in MongoDB with the error message.
    """
    col = get_analyses_collection()
    
    try:
        obj_id = ObjectId(analysis_id)
    except Exception as e:
        logger.error(f"Invalid analysis_id {analysis_id}: {e}")
        return
        
    update = {
        "$set": {
            "status": "failed",
            "error": error,
            "updatedAt": datetime.now(timezone.utc),
        }
    }
    
    try:
        result = await col.update_one({"_id": obj_id}, update)
        if result.matched_count == 0:
            logger.warning(f"Analysis {analysis_id} not found in DB.")
        else:
            logger.info(f"Successfully marked analysis {analysis_id} as failed.")
    except Exception as e:
        logger.error(f"Failed to mark analysis {analysis_id} as failed: {e}")
