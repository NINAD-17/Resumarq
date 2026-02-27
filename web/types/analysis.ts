import { ObjectId } from "mongodb";

// ─── Analysis Status ─────────────────────────────────────────────
export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

// ─── Agent Result Types ──────────────────────────────────────────

/** A single finding from the agent's analysis */
export interface Finding {
  category: string; // e.g. "missing_skill", "weak_bullet", "layout_issue"
  severity: "critical" | "warning" | "suggestion";
  title: string;
  description: string;
  source?: string; // Which part of the resume this relates to
}

/** A single actionable recommendation */
export interface Recommendation {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  originalText?: string; // The current text from the resume
  suggestedText?: string; // What the agent suggests instead
}

/** Hyperlink found in the resume */
export interface HyperlinkCheck {
  text: string; // The visible text (e.g. "GitHub")
  url: string; // The actual URL
  isAccessible: boolean; // Whether the URL resolves
  note?: string; // e.g. "404 - page not found"
}

/** Structured scores from the agent */
export interface AnalysisScores {
  overallFit: number; // 0-100: How well the resume matches the JD
  atsCompatibility: number; // 0-100: ATS-friendliness score
  contentQuality: number; // 0-100: Impact, action verbs, quantification
  layoutReadability: number; // 0-100: Visual layout and readability
}

/** The complete results object written by the agent */
export interface AnalysisResults {
  scores: AnalysisScores;
  summary: string; // 2-3 sentence overview
  findings: Finding[];
  recommendations: Recommendation[];
  hyperlinks: HyperlinkCheck[];
  matchedSkills: string[]; // Skills found in both resume and JD
  missingSkills: string[]; // Skills in JD but not in resume
}

// ─── Analysis Document ──────────────────────────────────────────

/** Full analysis document stored in MongoDB */
export interface AnalysisDocument {
  _id: ObjectId;
  userId: string;
  resumeId: string; // References a resume in the `resumes` collection

  // Input
  jdText: string; // The job description text pasted by the user

  // Processing
  status: AnalysisStatus;
  error?: string; // Error message if status is "failed"

  // Output (populated when status is "completed")
  results?: AnalysisResults;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/** Shape for creating a new analysis (no _id, no results yet) */
export type AnalysisInsert = Omit<
  AnalysisDocument,
  "_id" | "results" | "completedAt"
>;

/** Shape returned to the client (list endpoint omits jdText and results) */
export interface AnalysisResponse {
  id: string;
  resumeId: string;
  resumeFileName?: string; // Joined from resumes collection for display
  jdText?: string; // Omitted in list, included in detail
  status: AnalysisStatus;
  error?: string;
  results?: AnalysisResults; // Omitted in list, included in detail
  createdAt: string;
  completedAt?: string;
}

/** Convert a MongoDB document to a client-safe response */
export function toAnalysisResponse(
  doc: AnalysisDocument,
  resumeFileName?: string,
): AnalysisResponse {
  return {
    id: doc._id.toHexString(),
    resumeId: doc.resumeId,
    resumeFileName,
    jdText: doc.jdText,
    status: doc.status,
    error: doc.error,
    results: doc.results,
    createdAt: doc.createdAt.toISOString(),
    completedAt: doc.completedAt?.toISOString(),
  };
}
