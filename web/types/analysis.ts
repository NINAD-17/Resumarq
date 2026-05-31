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
  title: string; // LLM-generated short title, e.g. "MERN Full-Stack Developer Match"
  candidateName: string; // Candidate name from the parsed resume
  summary: string; // Critic's personalized conclusion
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
    results: doc.results ? normalizeResults(doc.results) : undefined,
    createdAt: doc.createdAt.toISOString(),
    completedAt: doc.completedAt?.toISOString(),
  };
}

/**
 * Normalizes results from MongoDB.
 *
 * The FastAPI agent returns snake_case keys (ats_audit, impact_audit, etc.)
 * which is standard Python. MongoDB stores them as-is. But our frontend
 * TypeScript interfaces use camelCase. This function maps between them.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeResults(raw: any): AnalysisResults {
  // If already camelCase (shouldn't happen, but be safe)
  const atsAudit = raw.atsAudit || raw.ats_audit;
  const impactAudit = raw.impactAudit || raw.impact_audit;
  const gapAnalysis = raw.gapAnalysis || raw.gap_analysis || null;
  const additionalFindings = raw.additionalFindings || raw.additional_findings || [];
  const matchedSkills = raw.matchedSkills || raw.matched_skills || [];
  const missingSkills = raw.missingSkills || raw.missing_skills || [];

  return {
    scores: raw.scores,
    title: raw.title || "",
    candidateName: raw.candidateName || raw.candidate_name || "",
    summary: raw.summary,
    atsAudit: atsAudit ? normalizeATSAudit(atsAudit) : { rules: [] },
    impactAudit: impactAudit ? normalizeImpactAudit(impactAudit) : {
      bulletAudits: [],
      careerProgressionNotes: [],
      employmentGaps: [],
      overallQuantificationRate: 0,
    },
    gapAnalysis: gapAnalysis ? normalizeGapAnalysis(gapAnalysis) : null,
    additionalFindings: additionalFindings.map(normalizeAdditionalFinding),
    matchedSkills,
    missingSkills,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeATSAudit(raw: any): ATSAuditResult {
  return {
    rules: (raw.rules || []).map((r: any) => ({
      ruleId: r.ruleId || r.rule_id,
      ruleName: r.ruleName || r.rule_name,
      status: r.status,
      finding: r.finding,
      suggestion: r.suggestion,
      affectedContent: r.affectedContent || r.affected_content,
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeImpactAudit(raw: any): ImpactAuditResult {
  return {
    bulletAudits: (raw.bulletAudits || raw.bullet_audits || []).map((b: any) => ({
      originalText: b.originalText || b.original_text,
      experienceCompany: b.experienceCompany || b.experience_company,
      isQuantified: b.isQuantified ?? b.is_quantified,
      hasStrongVerb: b.hasStrongVerb ?? b.has_strong_verb,
      showsOutcome: b.showsOutcome ?? b.shows_outcome,
      isTooVague: b.isTooVague ?? b.is_too_vague,
      isTooLong: b.isTooLong ?? b.is_too_long,
      weakVerbUsed: b.weakVerbUsed || b.weak_verb_used,
      issues: b.issues || [],
      suggestedRewrite: b.suggestedRewrite || b.suggested_rewrite,
      bulletScore: b.bulletScore ?? b.bullet_score,
    })),
    careerProgressionNotes: (raw.careerProgressionNotes || raw.career_progression_notes || []).map(
      (n: any) => ({
        observation: n.observation,
        severity: n.severity,
      })
    ),
    employmentGaps: raw.employmentGaps || raw.employment_gaps || [],
    overallQuantificationRate:
      raw.overallQuantificationRate ?? raw.overall_quantification_rate ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeGapAnalysis(raw: any): GapAnalysisResult {
  return {
    skillMatches: (raw.skillMatches || raw.skill_matches || []).map((s: any) => ({
      skill: s.skill,
      matchType: s.matchType || s.match_type,
      semanticEquivalent: s.semanticEquivalent || s.semantic_equivalent,
      importance: s.importance,
    })),
    responsibilityCoverage: (raw.responsibilityCoverage || raw.responsibility_coverage || []).map(
      (r: any) => ({
        responsibility: r.responsibility,
        covered: r.covered,
        evidence: r.evidence,
        gapNote: r.gapNote || r.gap_note,
      })
    ),
    seniorityMatch: raw.seniorityMatch ?? raw.seniority_match,
    seniorityNote: raw.seniorityNote || raw.seniority_note,
    keywordsToAdd: raw.keywordsToAdd || raw.keywords_to_add || [],
    keywordSuggestions: raw.keywordSuggestions || raw.keyword_suggestions || [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAdditionalFinding(raw: any): AdditionalFinding {
  return {
    category: raw.category,
    severity: raw.severity,
    title: raw.title,
    description: raw.description,
    suggestion: raw.suggestion,
  };
}
