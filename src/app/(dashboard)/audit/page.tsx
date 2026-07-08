import Link from "next/link";
import { requirePageRole } from "@/lib/access";
import { db } from "@/lib/db";

const ACTION_COLOR: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-sky-100 text-sky-700",
  DELETE: "bg-rose-100 text-rose-700",
  DEACTIVATE: "bg-rose-100 text-rose-700",
  STATUS_CHANGE: "bg-amber-100 text-amber-700",
  VOID: "bg-rose-100 text-rose-700",
};

function colorFor(action: string) {
  for (const [suffix, cls] of Object.entries(ACTION_COLOR)) {
    if (action.includes(suffix)) return cls;
  }
  return "bg-gray-100 text-gray-700";
}

function summarize(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return Object.entries(value as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(", ");
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string }>;
}) {
  await requirePageRole("OWNER_ADMIN");
  const { entityType } = await searchParams;

  const entityTypes = await db.auditLog.findMany({
    where: {},
    distinct: ["entityType"],
    select: { entityType: true },
    orderBy: { entityType: "asc" },
  });

  const logs = await db.auditLog.findMany({
    where: entityType ? { entityType } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Audit Trail</h1>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/audit"
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            !entityType ? "bg-orange-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-orange-300"
          }`}
        >
          All
        </Link>
        {entityTypes.map((e) => (
          <Link
            key={e.entityType}
            href={`/audit?entityType=${e.entityType}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              entityType === e.entityType
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-orange-300"
            }`}
          >
            {e.entityType}
          </Link>
        ))}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4">When</th>
            <th className="py-2 pr-4">User</th>
            <th className="py-2 pr-4">Action</th>
            <th className="py-2 pr-4">Entity</th>
            <th className="py-2 pr-4">Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-gray-100 align-top">
              <td className="py-2 pr-4 whitespace-nowrap text-gray-500">{log.createdAt.toLocaleString()}</td>
              <td className="py-2 pr-4 text-gray-700">{log.user?.name || "System"}</td>
              <td className="py-2 pr-4">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorFor(log.action)}`}>
                  {log.action.replace(/_/g, " ")}
                </span>
              </td>
              <td className="py-2 pr-4 text-gray-600">
                {log.entityType} <span className="text-xs text-gray-400">#{log.entityId.slice(-6)}</span>
              </td>
              <td className="py-2 pr-4 text-xs text-gray-500">
                {log.reason && <div className="mb-0.5 text-gray-700">Reason: {log.reason}</div>}
                {log.before ? <div>Before — {summarize(log.before)}</div> : null}
                {log.after ? <div>After — {summarize(log.after)}</div> : null}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-gray-400">
                No activity recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
