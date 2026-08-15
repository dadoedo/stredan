const WRITE_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "TRUNCATE",
  "CREATE",
  "GRANT",
  "REVOKE",
  "COPY",
];

const SAFE_KEYWORDS_AFTER_WITH = ["SELECT", "VALUES"];

export function isWriteOperation(sql: string): boolean {
  const normalized = sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  if (!normalized) {
    return false;
  }

  const withMatch = normalized.match(/^WITH\s+/);
  if (withMatch) {
    const afterWith = normalized.slice(withMatch[0].length);

    for (const keyword of WRITE_KEYWORDS) {
      const keywordRegex = new RegExp(`\\b${keyword}\\b`);
      if (keywordRegex.test(afterWith)) {
        const selectPos = afterWith.search(/\bSELECT\b/);
        const keywordPos = afterWith.search(keywordRegex);

        if (selectPos === -1 || keywordPos < selectPos) {
          return true;
        }
      }
    }

    return false;
  }

  for (const keyword of WRITE_KEYWORDS) {
    const regex = new RegExp(`^${keyword}\\b`);
    if (regex.test(normalized)) {
      return true;
    }
  }

  const statements = normalized.split(";").filter((s) => s.trim());
  for (const statement of statements) {
    const trimmed = statement.trim();
    for (const keyword of WRITE_KEYWORDS) {
      const regex = new RegExp(`^${keyword}\\b`);
      if (regex.test(trimmed)) {
        return true;
      }
    }
  }

  return false;
}

export function getStatementType(sql: string): string {
  const normalized = sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const keywords = [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "GRANT",
    "REVOKE",
    "COPY",
    "WITH",
    "EXPLAIN",
    "ANALYZE",
  ];

  for (const keyword of keywords) {
    const regex = new RegExp(`^${keyword}\\b`);
    if (regex.test(normalized)) {
      return keyword;
    }
  }

  return "UNKNOWN";
}
