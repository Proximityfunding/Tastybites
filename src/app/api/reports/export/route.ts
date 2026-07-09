import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { centavosToPesos } from "@/lib/money";

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

export async function GET(req: NextRequest) {
  const user = await requirePermission("reports");

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const from = new Date(searchParams.get("from") || "");
  const to = new Date(searchParams.get("to") || "");

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  let csv: string;
  let filename: string;

  if (type === "sales") {
    const orders = await db.order.findMany({
      where: { branchId: user.branchId, status: "COMPLETED", createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "asc" },
    });
    csv = toCsv([
      ["Order ID", "Date", "Channel", "Payment Method", "Total (PHP)"],
      ...orders.map((o) => [o.id, o.createdAt.toISOString(), o.channel, o.paymentMethod, centavosToPesos(o.total)]),
    ]);
    filename = "sales-report.csv";
  } else if (type === "expenses") {
    const expenses = await db.expense.findMany({
      where: { branchId: user.branchId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });
    csv = toCsv([
      ["Date", "Category", "Vendor", "Amount (PHP)", "Notes"],
      ...expenses.map((e) => [e.date.toISOString(), e.category, e.vendor || "", centavosToPesos(e.amount), e.notes || ""]),
    ]);
    filename = "expenses-report.csv";
  } else if (type === "pnl") {
    const entries = await db.ledgerEntry.findMany({
      where: { branchId: user.branchId, date: { gte: from, lte: to } },
      include: { account: true },
      orderBy: { date: "asc" },
    });
    csv = toCsv([
      ["Date", "Account", "Type", "Debit (PHP)", "Credit (PHP)", "Description"],
      ...entries.map((e) => [
        e.date.toISOString(),
        e.account.name,
        e.account.type,
        centavosToPesos(e.debit),
        centavosToPesos(e.credit),
        e.description || "",
      ]),
    ]);
    filename = "pnl-ledger.csv";
  } else {
    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
