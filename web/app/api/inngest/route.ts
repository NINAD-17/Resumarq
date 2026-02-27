import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processAnalysis } from "@/inngest/functions";

/**
 * Inngest Serve Endpoint
 *
 * Exposes all Inngest functions to the Inngest dev server / cloud.
 * - GET:  Returns function metadata (used by Inngest dashboard)
 * - POST: Inngest calls this to invoke functions
 * - PUT:  Triggers function registration with Inngest
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processAnalysis],
});
