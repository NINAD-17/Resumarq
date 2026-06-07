import { inngest } from "./client";
import { updateAnalysisStatus } from "@/lib/db/analyses";

/**
 * Inngest function: Process a resume analysis.
 *
 * Triggered when a new analysis is created (event: "analysis/created").
 *
 * Steps are durable — if the server crashes between steps, Inngest
 * resumes from the last completed step (memoized results).
 *
 * If all retries are exhausted, the onFailure handler updates
 * the analysis status to "failed" so the user isn't stuck on "processing".
 */
export const processAnalysis = inngest.createFunction(
  {
    id: "process-analysis",
    retries: 1,
    onFailure: async ({ event, error }) => {
      // This runs when the function fails permanently (after all retries).
      // Without this, the analysis would stay "processing" forever.
      const analysisId = event.data.event.data.analysisId;
      await updateAnalysisStatus(analysisId, "failed", {
        error: error.message || "Analysis failed unexpectedly",
      });
    },
  },
  { event: "analysis/created" },
  async ({ event, step }) => {
    const { analysisId, resumeS3Key, jdText } = event.data;

    // Step 1: Mark as processing
    await step.run("update-status-processing", async () => {
      await updateAnalysisStatus(analysisId, "processing");
    });

    // Step 2: Call the FastAPI agent server (Fire and Forget)
    await step.run("trigger-agent-server", async () => {
      const agentUrl = process.env.AGENT_SERVER_URL;
      const agentKey = process.env.AGENT_SERVER_KEY;

      if (!agentUrl || !agentKey) {
        throw new Error("Agent server URL or key not configured");
      }

      const response = await fetch(`${agentUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": agentKey,
        },
        body: JSON.stringify({
          analysisId,
          resumeS3Key,
          jdText,
        }),
      });

      if (response.status !== 202) {
        const errorText = await response.text();
        throw new Error(`Agent server rejected request (${response.status}): ${errorText}`);
      }

      // Return immediately — FastAPI will run the graph in the background
      // and update MongoDB directly when finished.
      return { queued: true };
    });

    return { success: true, analysisId };
  },
);
