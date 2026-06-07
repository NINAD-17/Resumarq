"""
Graph Builder — Assembles the full multi-agent LangGraph pipeline.

Execution order:
  START → [resume_parser, jd_parser] (parallel)
        → [ats_audit, impact_audit, gap_analysis] (parallel, after both parsers)
        → critic (after all three audits)
        → compiler (if approved) OR → ats_audit / impact_audit (if revising)
        → END

The graph is compiled once at module load time (build_graph() is called at the
bottom of this file). The endpoint imports `graph` directly and calls .invoke().
"""

import logging

from langgraph.graph import END, START, StateGraph

from graph.compiler import compiler_node
from graph.nodes.ats_audit import ats_audit_node
from graph.nodes.critic import critic_node
from graph.nodes.gap_analysis import gap_analysis_node
from graph.nodes.impact_audit import impact_audit_node
from graph.nodes.jd_parser import jd_parser_node
from graph.nodes.resume_parser import resume_parser_node
from graph.state import AgentState

logger = logging.getLogger(__name__)


# ─── Conditional Routing ──────────────────────────────────────────


MAX_REVISIONS = 2

def route_after_critic(state: AgentState) -> str:
    """
    Reads the Critic's decision from state and returns the next node name.

    Called by LangGraph after the critic node completes.
    Returns a string that maps to a node name in the graph.
    """
    critic = state.get("critic_result", {})
    revision_count = state.get("revision_count", 0)

    # Safety net: If critic accidentally flags revise after MAX_REVISIONS, force compile
    if revision_count >= MAX_REVISIONS:
        logger.warning("Max revisions reached in router — forcing compiler")
        return "compiler"

    if critic.get("approved"):
        logger.info("Critic approved — routing to compiler")
        return "compiler"

    if critic.get("revise_ats"):
        logger.info("Routing back to ATS Audit for revision")
        return "ats_audit"

    if critic.get("revise_impact"):
        logger.info("Routing back to Impact Audit for revision")
        return "impact_audit"

    # Fallback: if approved=False but no revision flags set, just compile
    logger.warning("Critic returned no revision flags — falling back to compiler")
    return "compiler"


# ─── Graph Assembly ───────────────────────────────────────────────


def build_graph():
    """
    Build and compile the StateGraph.

    Node execution order:
    - Tier 1 (parallel): resume_parser, jd_parser
    - Tier 2 (parallel): ats_audit, impact_audit, gap_analysis
      Each waits for BOTH parsers to finish (they have two incoming edges)
    - Tier 3: critic (waits for all three audits)
    - Tier 4: conditional — compiler or re-run an audit (revision loop)
    - Tier 5: END
    """
    workflow = StateGraph(AgentState)

    # ── Register nodes ────────────────────────────────────────────
    workflow.add_node("resume_parser", resume_parser_node)
    workflow.add_node("jd_parser", jd_parser_node)
    workflow.add_node("ats_audit", ats_audit_node)
    workflow.add_node("impact_audit", impact_audit_node)
    workflow.add_node("gap_analysis", gap_analysis_node)
    workflow.add_node("critic", critic_node)
    workflow.add_node("compiler", compiler_node)

    # ── Tier 1: Both parsers start in parallel from START ─────────
    workflow.add_edge(START, "resume_parser")
    workflow.add_edge(START, "jd_parser")

    # ── Tier 2: Audits start only after BOTH parsers complete ─────
    # Each audit has two incoming edges → LangGraph waits for both before running.
    # ATS and Impact only use resume_profile, but we still gate on jd_parser
    # to keep the graph simple — both parsers always run first.
    workflow.add_edge("resume_parser", "ats_audit")
    workflow.add_edge("jd_parser", "ats_audit")

    workflow.add_edge("resume_parser", "impact_audit")
    workflow.add_edge("jd_parser", "impact_audit")

    workflow.add_edge("resume_parser", "gap_analysis")
    workflow.add_edge("jd_parser", "gap_analysis")

    # ── Tier 3: Critic waits for all three audits ─────────────────
    workflow.add_edge("ats_audit", "critic")
    workflow.add_edge("impact_audit", "critic")
    workflow.add_edge("gap_analysis", "critic")

    # ── Tier 4: Conditional routing from Critic ───────────────────
    # route_after_critic() reads critic_result from state and returns a node name
    workflow.add_conditional_edges(
        "critic",
        route_after_critic,
        {
            "compiler": "compiler",  # Approved → compile and return
            "ats_audit": "ats_audit",  # Revision → re-run ATS audit
            "impact_audit": "impact_audit",  # Revision → re-run Impact audit
        },
    )

    # ── Tier 5: End ───────────────────────────────────────────────
    workflow.add_edge("compiler", END)

    return workflow.compile()


# Compile once at module load — the endpoint imports this directly
graph = build_graph()
