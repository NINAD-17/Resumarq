"""
Background tasks for the Agent Server.
"""
from graph.state import AgentState
import logging
from graph.builder import graph
from app.models import AnalyzeRequest
from app.db_writes import save_analysis_result, mark_analysis_failed, update_analysis_status

logger = logging.getLogger(__name__)

async def run_analysis_task(request: AnalyzeRequest):
    """
    Run the multi-agent analysis in the background and save results to MongoDB.
    """
    logger.info("Starting background analysis task for analysis_id=%s", request.analysis_id)
    
    initial_state: AgentState = {
        "analysis_id": request.analysis_id,
        "resume_s3_key": request.resume_s3_key,
        "jd_text": request.jd_text,
        "resume_profile": None,
        "jd_profile": None,
        "ats_audit": None,
        "impact_audit": None,
        "gap_analysis": None,
        "critic_result": None,
        "revision_count": 0,
        "revision_notes": None,
        "final_result": None,
        "status": "processing",
        "error": None,
    }

    try:
        current_state = initial_state.copy()
        
        # Stream the graph execution to provide granular status updates to the UI
        async for output in graph.astream(initial_state):
            node_name = list(output.keys())[0]
            current_state.update(output[node_name])
            
            # Map graph nodes to human-readable statuses for the frontend UI
            status_map = {
                "resume_parser": "extracting_data",
                "jd_parser": "extracting_data",
                "ats_audit": "analyzing_ats",
                "impact_audit": "evaluating_impact",
                "gap_analysis": "comparing_gap",
                "critic": "generating_feedback",
                "compiler": "compiling_report"
            }
            
            if node_name in status_map:
                await update_analysis_status(request.analysis_id, status_map[node_name])
                
        final_state = current_state
        
        if final_state.get("status") == "failed" or not final_state.get("final_result"):
            error = final_state.get("error", "Unknown error during graph execution")
            logger.error("Analysis graph failed for %s: %s", request.analysis_id, error)
            await mark_analysis_failed(request.analysis_id, error)
        else:
            logger.info("Analysis complete for analysis_id=%s, saving to DB", request.analysis_id)
            await save_analysis_result(request.analysis_id, final_state["final_result"])
            
    except Exception as e:
        logger.exception("Unexpected error in background task for analysis_id=%s", request.analysis_id)
        await mark_analysis_failed(request.analysis_id, f"Analysis failed: {str(e)}")
