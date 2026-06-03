export const demoAnalysisData = {
  id: "demo-analysis-id",
  resumeId: "demo-resume-id",
  resumeFileName: "Alex_Rivera_Resume.pdf",
  status: "completed" as const,
  createdAt: "2026-03-03T15:48:46.945Z",
  completedAt: "2026-03-03T15:52:05.013Z",
  jdText: "Job Description: Full-Stack Developer (MERN) Overview We are seeking a passionate and skilled Full-Stack Developer to design, build, and scale web applications using modern frameworks and tools. ....",
  results: {
    candidateName: "Alex Rivera",
    title: "MERN Full-Stack Developer Match",
    summary: "This resume showcases strong technical project work and relevant skills for a student. However, the primary area for improvement is the complete lack of quantification in all project descriptions, which significantly diminishes the perceived impact of your achievements. Additionally, reformatting to a single-column layout is crucial for ATS compatibility.",
    scores: {
      ats: 76,
      impact: 35,
      match: 87,
      overall: 35
    },
    atsAudit: {
      rules: [
        {
          ruleId: "contact_completeness",
          ruleName: "Contact Info Completeness",
          status: "pass" as const,
        },
        {
          ruleId: "standard_section_headers",
          ruleName: "Standard Section Headers",
          status: "pass" as const,
        },
        {
          ruleId: "date_format_consistency",
          ruleName: "Date Format Consistency",
          status: "pass" as const,
        },
        {
          affectedContent: "Overall resume layout",
          finding: "The resume uses a multi-column layout or tables, which can be difficult for ATS to parse correctly.",
          ruleId: "no_tables_or_columns",
          ruleName: "No Tables or Columns",
          status: "critical" as const,
          suggestion: "Reformat the resume to use a single-column layout without tables or complex formatting to ensure optimal ATS parsing."
        },
        {
          ruleId: "action_verb_usage",
          ruleName: "Bullet Points Start with Action Verbs",
          status: "pass" as const,
        },
        {
          ruleId: "no_personal_pronouns",
          ruleName: "No Personal Pronouns",
          status: "pass" as const,
        },
        {
          ruleId: "appropriate_length",
          ruleName: "Appropriate Resume Length",
          status: "pass" as const,
        },
        {
          ruleId: "professional_email",
          ruleName: "Professional Email Address",
          status: "pass" as const,
        },
        {
          ruleId: "skills_section_present",
          ruleName: "Dedicated Skills Section Present",
          status: "pass" as const,
        },
        {
          affectedContent: "Summary section",
          finding: "A summary or objective section is missing from the resume.",
          ruleId: "summary_present",
          ruleName: "Summary or Objective Present",
          status: "warning" as const,
          suggestion: "Add a concise summary or objective statement at the top of your resume to highlight your key qualifications and career goals, improving keyword density for ATS."
        },
        {
          ruleId: "no_special_chars_in_headers",
          ruleName: "No Special Characters in Section Headers",
          status: "pass" as const,
        },
        {
          affectedContent: "All project bullet points",
          finding: "None of the bullet points contain quantifiable achievements or metrics (0% quantification rate).",
          ruleId: "quantification_rate",
          ruleName: "Sufficient Quantification in Bullets",
          status: "critical" as const,
          suggestion: "Rephrase bullet points to include numbers, percentages, or specific results to demonstrate impact (e.g., 'Increased efficiency by 15%', 'Managed a team of 5')."
        },
        {
          ruleId: "consistent_tense",
          ruleName: "Consistent Verb Tense",
          status: "pass" as const,
        },
        {
          ruleId: "linkedin_present",
          ruleName: "LinkedIn Profile Included",
          status: "pass" as const,
        },
        {
          ruleId: "no_buzzword_stuffing",
          ruleName: "No Buzzword Stuffing",
          status: "pass" as const,
        }
      ]
    },
    impactAudit: {
      overallQuantificationRate: 0,
      employmentGaps: [],
      careerProgressionNotes: [
        {
          observation: "Candidate is currently a student with project experience but no formal work experience.",
          severity: "neutral" as const
        }
      ],
      bulletAudits: [
        {
          bulletScore: 60,
          experienceCompany: "NexusDev Community",
          hasStrongVerb: true,
          isQuantified: false,
          isTooLong: false,
          isTooVague: true,
          issues: [
            "This bullet describes an outcome but lacks quantification to demonstrate the impact of the design.",
            "The term 'intuitive UI' is somewhat vague; specify key design elements or user feedback."
          ],
          originalText: "Designed an intuitive UI for seamless user experience.",
          showsOutcome: true,
          suggestedRewrite: "Designed an intuitive UI, improving user engagement by [X%] and reducing task completion time by [Y%] for [N] users.",
        },
        {
          bulletScore: 55,
          experienceCompany: "NexusDev Community",
          hasStrongVerb: true,
          isQuantified: false,
          isTooLong: false,
          isTooVague: false,
          issues: [
            "This bullet describes a task (implementing features) without showing the impact or outcome for users or the platform.",
            "Lacks quantification regarding the scale or success of the implemented features."
          ],
          originalText: "Implemented social networking features: posts, connections, comments, and profile updates.",
          showsOutcome: false,
          suggestedRewrite: "Implemented core social networking features (posts, connections, comments, profile updates), increasing user interaction by [X%] and fostering a [Y%] more active community.",
        },
        {
          bulletScore: 55,
          experienceCompany: "NexusDev Community",
          hasStrongVerb: true,
          isQuantified: false,
          isTooLong: false,
          isTooVague: false,
          issues: [
            "This bullet describes a task (facilitating features) without showing the impact or outcome for users or the platform.",
            "Lacks quantification regarding the scale or success of the implemented features."
          ],
          originalText: "Facilitated group interactions: join groups and make group posts.",
          showsOutcome: false,
          suggestedRewrite: "Developed group interaction features, enabling [N] users to join and create group posts, boosting collaborative engagement by [X%].",
        },
        {
          bulletScore: 40,
          experienceCompany: "NexusDev Community",
          hasStrongVerb: false,
          isQuantified: false,
          isTooLong: false,
          isTooVague: true,
          issues: [
            "The verb 'Utilized' is weak; consider a more active verb.",
            "The outcome 'robust and scalable platform' is vague and lacks specific metrics or examples of robustness/scalability.",
            "Lacks quantification regarding the platform's performance or capacity."
          ],
          originalText: "Utilized MERN stack for a robust and scalable platform.",
          showsOutcome: true,
          suggestedRewrite: "Engineered a robust and scalable platform using the MERN stack, supporting [N] concurrent users and achieving [X%] uptime.",
          weakVerbUsed: "Utilized"
        },
        {
          bulletScore: 60,
          experienceCompany: "1-Click News",
          hasStrongVerb: true,
          isQuantified: false,
          isTooLong: false,
          isTooVague: true,
          issues: [
            "The outcome 'comprehensive coverage' is vague; quantify the number of sources or the breadth of topics covered.",
            "Lacks quantification regarding the volume of news aggregated or the impact on user information access."
          ],
          originalText: "Aggregated news from multiple sources using a news API for comprehensive coverage.",
          showsOutcome: true,
          suggestedRewrite: "Aggregated news from [N] diverse sources using a news API, providing comprehensive coverage across [X] categories and increasing content availability by [Y%].",
        },
        {
          bulletScore: 55,
          experienceCompany: "1-Click News",
          hasStrongVerb: true,
          isQuantified: false,
          isTooLong: false,
          isTooVague: false,
          issues: [
            "This bullet describes a task (implementing a feature) without showing the impact or outcome for users.",
            "Lacks quantification regarding the search performance, the volume of searchable content, or user engagement with the feature."
          ],
          originalText: "Implemented a search feature to access current and archived news.",
          showsOutcome: false,
          suggestedRewrite: "Implemented a robust search feature, enabling users to quickly access [N] current and archived news articles, improving content discoverability by [X%].",
        },
        {
          bulletScore: 60,
          experienceCompany: "1-Click News",
          hasStrongVerb: true,
          isQuantified: false,
          isTooLong: false,
          isTooVague: true,
          issues: [
            "This bullet describes an outcome but lacks quantification to demonstrate the impact of the design.",
            "The terms 'intuitive and visually appealing UI' are somewhat vague; specify key design elements or user feedback."
          ],
          originalText: "Designed an intuitive and visually appealing UI for an enhanced reading experience.",
          showsOutcome: true,
          suggestedRewrite: "Designed an intuitive and visually appealing UI, increasing user engagement by [X%] and reducing bounce rate by [Y%] for an enhanced reading experience.",
        }
      ]
    },
    gapAnalysis: {
      keywordsToAdd: [
        "scalable web applications",
        "dynamic content delivery",
        "cloud deployment platforms",
        "AWS",
        "Vercel",
        "Azure",
        "CI/CD pipelines",
        "DevOps practices",
        "TypeScript",
        "microservices architecture",
        "containerization",
        "Docker",
        "Kubernetes",
        "communication skills",
        "optimize applications for performance and security",
        "technical workflows",
        "knowledge-sharing",
        "cutting-edge web applications",
        "cloud-native technologies",
        "modern deployment practices"
      ],
      keywordSuggestions: [
        "For your 'NexusDev Community' project, consider adding how you ensured the platform was 'scalable' and delivered 'dynamic content' efficiently.",
        "If you have any experience with deploying your projects, consider adding a section on 'Deployment & Infrastructure' mentioning tools like 'AWS', 'Vercel', or 'Azure', and any exposure to 'CI/CD pipelines' or 'DevOps practices'.",
        "For your projects, consider adding bullet points that highlight any efforts made to 'optimize applications for performance and security'.",
        "In your project descriptions or a new 'Collaboration' section, you could add: 'Contributed to documenting 'technical workflows' and fostered 'knowledge-sharing' within the team.'",
        "If you have any academic exposure or personal learning in 'TypeScript', 'microservices architecture', 'containerization', 'Docker', or 'Kubernetes', consider adding them to your skills.",
        "While implied by leading a hackathon team, explicitly state 'Strong communication skills' and 'teamwork' in a summary or 'Soft Skills' section."
      ],
      seniorityMatch: false,
      seniorityNote: "The candidate is currently a student (expected graduation 2025) with project-based experience. This aligns more with an entry-level or intern position rather than a mid-level Full-Stack Developer role which typically requires 2-5 years of professional experience.",
      skillMatches: [
        {
          importance: "required" as const,
          matchType: "exact" as const,
          skill: "JavaScript"
        },
        {
          importance: "required" as const,
          matchType: "exact" as const,
          skill: "C++"
        },
        {
          importance: "required" as const,
          matchType: "semantic" as const,
          semanticEquivalent: "MERN",
          skill: "MERN stack development"
        },
        {
          importance: "required" as const,
          matchType: "exact" as const,
          skill: "ReactJS"
        },
        {
          importance: "required" as const,
          matchType: "exact" as const,
          skill: "MongoDB"
        },
        {
          importance: "preferred" as const,
          matchType: "missing" as const,
          skill: "AWS"
        },
        {
          importance: "preferred" as const,
          matchType: "missing" as const,
          skill: "TypeScript"
        },
        {
          importance: "preferred" as const,
          matchType: "missing" as const,
          skill: "Docker"
        }
      ],
      responsibilityCoverage: [
        {
          covered: true,
          evidence: "Developed a LinkedIn-like community platform for State Tech University... Utilized MERN stack for a robust and scalable platform.",
          responsibility: "Design and develop scalable web applications using MongoDB, Express.js, ReactJS, and Node.js"
        },
        {
          covered: true,
          evidence: "Designed an intuitive UI for seamless user experience. (NexusDev Community) Designed an intuitive and visually appealing UI for an enhanced reading experience. (1-Click News)",
          responsibility: "Build and maintain intuitive user interfaces with ReactJS, Redux, Tailwind CSS, and Bootstrap"
        },
        {
          covered: true,
          evidence: "Smart India Hackathon 2024 [Certificate] Led team DevMinds to successfully pass the first round (internal hackathon) held at State Tech University, showcasing innovative solutions and technical skills.",
          responsibility: "Participate in hackathons and collaborative projects, applying innovative solutions to real-world problems"
        },
        {
          covered: false,
          gapNote: "The resume does not explicitly mention documenting technical workflows or contributing to knowledge-sharing activities within a team context.",
          responsibility: "Document technical workflows and contribute to knowledge-sharing within the team"
        }
      ]
    },
    matchedSkills: [
      "JavaScript",
      "C++",
      "MERN stack development",
      "ReactJS",
      "MongoDB",
      "SQL databases",
      "software engineering fundamentals",
      "Participation in hackathons or coding competitions"
    ],
    missingSkills: [
      "cloud deployment platforms",
      "AWS",
      "TypeScript",
      "Docker"
    ],
    additionalFindings: [
      {
        category: "Content Quality",
        description: "The 'Achievements' section describes participation in a hackathon and leading a team, but the bullet point lacks specific details, quantification, and the outcome of the achievement.",
        severity: "warning" as const,
        suggestion: "Rephrase the achievement to highlight specific contributions, quantify the success (e.g., 'outperformed X teams,' 'developed a solution that achieved Y'), and describe the impact of the innovative solutions.",
        title: "Lack of Impact in Achievements Section"
      }
    ]
  }
};
