-- Sendable leads already in stredan. DRAFT_ONLY uses this — no RPO pull.
-- Cap the agent-side list at 40 (same as the send cap). Leftovers wait.
-- Sendable offer: A–D with outputJson.send = true OR score >= 50.

SELECT
  c.ico,
  c.name,
  c."naceCode" AS nace,
  l.id AS lead_id,
  l.status,
  lc.email,
  lc."fullName",
  array_agg(DISTINCT o.code ORDER BY o.code) FILTER (
    WHERE o.code IN ('A', 'B', 'C', 'D')
      AND (
        COALESCE((ls."outputJson"->>'send')::boolean, false)
        OR ls.score >= 50
      )
  ) AS sendable_offers
FROM "Lead" l
JOIN "Company" c ON c.id = l."companyId"
JOIN LATERAL (
  SELECT email, "fullName"
  FROM "LeadContact" x
  WHERE x."leadId" = l.id
    AND x.email IS NOT NULL
    AND btrim(x.email) <> ''
  ORDER BY x."isPrimary" DESC, x."createdAt"
  LIMIT 1
) lc ON true
JOIN "LeadScore" ls ON ls."leadId" = l.id
JOIN "Offer" o ON o.id = ls."offerId"
WHERE l."skipReason" IS NULL
  AND l.status NOT IN ('suppressed', 'won', 'lost', 'skipped', 'contacted')
  AND NOT EXISTS (SELECT 1 FROM "Touch" t WHERE t."leadId" = l.id)
  AND NOT EXISTS (
    SELECT 1 FROM "Suppression" s
    WHERE s.ico = c.ico OR lower(s.email) = lower(lc.email)
  )
GROUP BY c.ico, c.name, c."naceCode", l.id, l.status, lc.email, lc."fullName"
HAVING COUNT(*) FILTER (
  WHERE o.code IN ('A', 'B', 'C', 'D')
    AND (
      COALESCE((ls."outputJson"->>'send')::boolean, false)
      OR ls.score >= 50
    )
) > 0
ORDER BY random()
LIMIT 40;
