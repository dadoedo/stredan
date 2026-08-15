import { sql } from "./db/client.js";

export async function audit(
  adminId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await sql`
    INSERT INTO audit_log (admin_id, action, entity_type, entity_id, meta)
    VALUES (
      ${adminId},
      ${action},
      ${entityType ?? null},
      ${entityId ?? null},
      ${meta ? sql.json(meta as never) : null}
    )
  `;
}
