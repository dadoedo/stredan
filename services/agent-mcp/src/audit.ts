import { sql } from "./db/client.js";

export async function audit(
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  meta?: Record<string, unknown>,
  extra?: {
    apiKeyId?: string | null;
    success?: boolean | null;
    tool?: string | null;
    target?: string | null;
  }
): Promise<void> {
  const tool = extra?.tool ? extra.tool.slice(0, 200) : null;
  const target = extra?.target ? extra.target.slice(0, 200) : null;
  await sql`
    INSERT INTO audit_log (user_id, api_key_id, action, entity_type, entity_id, meta, success, tool, target)
    VALUES (
      ${userId},
      ${extra?.apiKeyId ?? null},
      ${action},
      ${entityType ?? null},
      ${entityId ?? null},
      ${meta ? sql.json(meta as never) : null},
      ${extra?.success ?? null},
      ${tool},
      ${target}
    )
  `;
}
