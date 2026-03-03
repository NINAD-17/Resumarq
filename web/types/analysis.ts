import { ObjectId } from "mongodb";

// ─── Analysis Status ─────────────────────────────────────────────
export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

// ─── ATS Audit Types ─────────────────────────────────────────────

/** Result of evaluating a single ATS rule */
export interface ATSRuleResult {
  ruleId: string; // e.g. "contact_completeness"
  ruleName: string; // e.g. "Contact Info Completeness"
  status: "pass" | "warning" | "critical";
  finding?: string; // What specifically is wrong
  suggestion?: string; // How to fix it
  affectedContent?: string; // The text causing the issue
}

/** Full ATS audit — list of all evaluated rules */
export interface ATSAuditResult {
  rules: ATSRuleResult[];
}

// ─── Impact Audit Types ──────────────────────────────────────────

/** Evaluation of a single resume bullet point */
export interface BulletAuditResult {
  originalText: string;
  experienceCompany: string;
  isQuantified: boolean;
  hasStrongVerb: boolean;
  showsOutcome: boolean;
  isTooVague: boolean;
  isTooLong: boolean;
  weakVerbUsed?: string;
  issues: string[];
  suggestedRewrite?: string; // Specific rewrite with [X%], [N] placeholders
  bulletScore: number; // 0-100
}

export interface CareerProgressionNote {
  observation: string;
  severity: "positive" | "warning" | "neutral";
}

/** Full impact audit — all bullets scored with rewrites */
export interface ImpactAuditResult {
  bulletAudits: BulletAuditResult[];
  careerProgressionNotes: CareerProgressionNote[];
  employmentGaps: string[];
  overallQuantificationRate: number; // 0.0-1.0
}

// ─── Gap Analysis Types ──────────────────────────────────────────

/** How a JD skill maps to the resume */
export interface SkillMatch {
  skill: string;
  matchType: "exact" | "semantic" | "missing";
  semanticEquivalent?: string; // What the resume calls it
  importance: "required" | "preferred";
}

export interface ResponsibilityCoverage {
  responsibility: string;
  covered: boolean;
  evidence?: string;
  gapNote?: string;
}

/** Full gap analysis — skills, responsibilities, seniority */
export interface GapAnalysisResult {
  skillMatches: SkillMatch[];
  responsibilityCoverage: ResponsibilityCoverage[];
  seniorityMatch: boolean;
  seniorityNote?: string;
  keywordsToAdd: string[];
  keywordSuggestions: string[];
}

// ─── Scores & Summary ────────────────────────────────────────────

export interface AnalysisScores {
  overall: number; // 0-100: Critic's holistic score
  ats: number; // 0-100: Calculated from ATS rules
  impact: number; // 0-100: Calculated from bullet scores
  match: number | null; // 0-100: Skill match vs JD (null if no JD)
}

export interface AdditionalFinding {
  category: string;
  severity: "critical" | "warning" | "suggestion";
  title: string;
  description: string;
  suggestion: string;
}

/** Complete analysis results written by the multi-agent graph */
export interface AnalysisResults {
  scores: AnalysisScores;
  summary: string; // Critic's 2-3 sentence conclusion
  atsAudit: ATSAuditResult;
  impactAudit: ImpactAuditResult;
  gapAnalysis: GapAnalysisResult | null; // null in resume-only mode
  additionalFindings: AdditionalFinding[];
  matchedSkills: string[]; // Required skills present in resume
  missingSkills: string[]; // Required skills absent from resume
}

// ─── Analysis Document ──────────────────────────────────────────

/** Full analysis document stored in MongoDB */
export interface AnalysisDocument {
  _id: ObjectId;
  userId: string;
  resumeId: string;
  jdText: string | null; // null in resume-only mode
  status: AnalysisStatus;
  error?: string;
  results?: AnalysisResults;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type AnalysisInsert = Omit<
  AnalysisDocument,
  "_id" | "results" | "completedAt"
>;

/** Shape returned to the client */
export interface AnalysisResponse {
  id: string;
  resumeId: string;
  resumeFileName?: string;
  jdText?: string | null;
  status: AnalysisStatus;
  error?: string;
  results?: AnalysisResults;
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
