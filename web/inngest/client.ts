import { Inngest } from "inngest";

/**
 * Inngest Client
 *
 * Single client instance shared across all functions and event sends.
 * The id identifies this app in the Inngest dashboard.
 */
export const inngest = new Inngest({ id: "resumarq" });
