export const vulnerabilityHighlights = [
  {
    title: "Unsafe search",
    summary: "Planned raw SQL query paths for search and password reset training.",
  },
  {
    title: "Weak sessions",
    summary: "Long-lived readable cookies model token theft and replay scenarios.",
  },
  {
    title: "AI tool risk",
    summary: "Chatbot tools intentionally combine broad data search with state mutation.",
  },
];

export const plannedVulnerabilities = [
  "sql-injection",
  "command-injection",
  "ssrf",
  "unsafe-upload",
  "idor",
  "csrf",
  "open-redirect",
  "weak-password-hashing",
  "weak-session-cookies",
  "sensitive-data-exposure",
  "xss",
  "ai-data-access",
  "ai-write-access",
] as const;
