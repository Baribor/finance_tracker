import AuditLog from "@/models/AuditLog";

interface AuditEntry {
  action: string;
  performedBy: string;
  targetType: string;
  targetId?: string;
  group?: string | null;
  details: string;
  meta?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create({
      action: entry.action,
      performedBy: entry.performedBy,
      targetType: entry.targetType,
      targetId: entry.targetId || undefined,
      group: entry.group || undefined,
      details: entry.details,
      meta: entry.meta || undefined,
    });
  } catch (err) {
    console.error("[audit] Failed to log:", err);
  }
}
