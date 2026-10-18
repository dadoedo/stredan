export interface ToolAudit {
  record(event: { tool: string; target: string | null; success: boolean }): Promise<void>;
}

export function targetFromArgs(args: unknown): string | null {
  if (!args || typeof args !== "object") return null;
  const obj = args as Record<string, unknown>;
  const value = obj.database ?? obj.account;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 200) : null;
}

function failed(result: unknown): boolean {
  return (
    typeof result === "object" &&
    result !== null &&
    "isError" in result &&
    (result as { isError?: boolean }).isError === true
  );
}

export async function recordTool<T>(
  audit: ToolAudit | undefined,
  tool: string,
  target: string | null,
  fn: () => Promise<T>
): Promise<T> {
  let success = false;
  try {
    const result = await fn();
    success = !failed(result);
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    if (audit) {
      await audit.record({ tool, target, success }).catch((err) => {
        console.error("mcp audit failed:", err instanceof Error ? err.message : err);
      });
    }
  }
}
