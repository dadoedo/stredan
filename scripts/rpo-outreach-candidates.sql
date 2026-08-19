-- Ranked outreach pool: non-technical SK SMEs, Bratislava first.
-- "Active" = still in register + current konateľ + current address.
-- Do NOT use profit / tax / tiny equity as inactivity (SK tax-opt. is common).
-- EXCLUDES NACE 62/63 IT. Rebuild: psql -d rpo -f this file.

DROP TABLE IF EXISTS rpo2.outreach_candidates;

CREATE TABLE rpo2.outreach_candidates AS
SELECT DISTINCT ON (ico)
  o.id AS rpo_id,
  o.data->'identifiers'->0->>'value' AS ico,
  cur_name.value AS name,
  cur_addr.city,
  o.data->'statisticalCodes'->'mainActivity'->>'code' AS nace,
  o.data->'statisticalCodes'->'mainActivity'->>'value' AS nace_label,
  left(o.data->'statisticalCodes'->'mainActivity'->>'code', 2) AS nace_div,
  (o.data->>'establishment')::date AS established,
  cur_body.konatel,
  (
    CASE left(o.data->'statisticalCodes'->'mainActivity'->>'code', 2)
      WHEN '69' THEN 40
      WHEN '86' THEN 38
      WHEN '46' THEN 32
      WHEN '49' THEN 32
      WHEN '52' THEN 32
      WHEN '41' THEN 28
      WHEN '43' THEN 28
      WHEN '45' THEN 26
      WHEN '68' THEN 26
      WHEN '71' THEN 24
      WHEN '73' THEN 22
      WHEN '81' THEN 20
      WHEN '77' THEN 18
      WHEN '82' THEN 12
      ELSE 0
    END
    + CASE
      WHEN left(o.data->'statisticalCodes'->'mainActivity'->>'code', 2) BETWEEN '10' AND '33'
        THEN 34
      ELSE 0
    END
    + CASE
      WHEN cur_addr.city LIKE 'Bratislava%' THEN 80
      WHEN cur_addr.city LIKE 'Košice%' THEN 12
      WHEN cur_addr.city IN (
        'Žilina', 'Prešov', 'Nitra', 'Trnava', 'Banská Bystrica', 'Trenčín'
      ) THEN 10
      ELSE 0
    END
    + CASE
      WHEN (o.data->>'establishment')::date BETWEEN DATE '2010-01-01' AND DATE '2020-12-31' THEN 15
      WHEN (o.data->>'establishment')::date BETWEEN DATE '2004-01-01' AND DATE '2009-12-31' THEN 10
      WHEN (o.data->>'establishment')::date BETWEEN DATE '2021-01-01' AND DATE '2022-12-31' THEN 8
      ELSE 0
    END
    + 10
  )::int AS score
FROM rpo2.organizations o
CROSS JOIN LATERAL (
  SELECT n->>'value' AS value
  FROM jsonb_array_elements(COALESCE(o.data->'fullNames', '[]'::jsonb)) n
  WHERE n->>'validTo' IS NULL
    AND n->>'value' IS NOT NULL
  ORDER BY n->>'validFrom' DESC NULLS LAST
  LIMIT 1
) cur_name
CROSS JOIN LATERAL (
  SELECT a->'municipality'->>'value' AS city
  FROM jsonb_array_elements(COALESCE(o.data->'addresses', '[]'::jsonb)) a
  WHERE a->>'validTo' IS NULL
    AND a->'municipality'->>'value' IS NOT NULL
  ORDER BY a->>'validFrom' DESC NULLS LAST
  LIMIT 1
) cur_addr
CROSS JOIN LATERAL (
  SELECT b->'personName'->>'formatedName' AS konatel
  FROM jsonb_array_elements(COALESCE(o.data->'statutoryBodies', '[]'::jsonb)) b
  WHERE b->>'validTo' IS NULL
    AND b->'personName'->>'formatedName' IS NOT NULL
  ORDER BY b->>'validFrom' DESC NULLS LAST
  LIMIT 1
) cur_body
WHERE o.data->'legalForms'->0->'value'->>'code' = '112'
  AND COALESCE((o.data->>'containsInconsistency')::boolean, false) = false
  AND o.data->'statisticalCodes'->'mainActivity'->>'code' IS NOT NULL
  AND left(o.data->'statisticalCodes'->'mainActivity'->>'code', 2) NOT IN ('62', '63', '64', '65', '66', '70', '72')
  AND (
    left(o.data->'statisticalCodes'->'mainActivity'->>'code', 2) IN (
      '69', '86', '46', '49', '52', '41', '43', '45', '68', '71', '73', '81', '77', '82'
    )
    OR left(o.data->'statisticalCodes'->'mainActivity'->>'code', 2) BETWEEN '10' AND '33'
  )
  AND cur_name.value !~* 'likvid|konkurz|v likvidácii|zrušen'
  AND o.data->'identifiers'->0->>'value' IS NOT NULL
ORDER BY ico, score DESC, o.id;

ALTER TABLE rpo2.outreach_candidates ADD PRIMARY KEY (rpo_id);
CREATE UNIQUE INDEX outreach_candidates_ico_key ON rpo2.outreach_candidates (ico);
CREATE INDEX outreach_candidates_score_idx ON rpo2.outreach_candidates (score DESC, rpo_id);
CREATE INDEX outreach_candidates_nace_idx ON rpo2.outreach_candidates (nace);
CREATE INDEX outreach_candidates_nace_div_idx ON rpo2.outreach_candidates (nace_div);
CREATE INDEX outreach_candidates_city_idx ON rpo2.outreach_candidates (city);
CREATE INDEX outreach_candidates_ba_idx ON rpo2.outreach_candidates ((city LIKE 'Bratislava%'));

ANALYZE rpo2.outreach_candidates;
