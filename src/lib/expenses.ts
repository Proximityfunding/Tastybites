import "server-only";
import { db } from "./db";
import type { ExpenseCategory } from "@prisma/client";

const CATEGORY_TO_ACCOUNT_CODE: Record<ExpenseCategory, string> = {
  SUPPLIES: "5000",
  RENT: "5100",
  UTILITIES: "5200",
  SALARIES: "5300",
  DELIVERY_FEES: "5400",
  MISC: "5900",
};

export async function postExpenseLedger(expenseId: string) {
  const expense = await db.expense.findUniqueOrThrow({ where: { id: expenseId } });
  const [expenseAccount, cash] = await Promise.all([
    db.chartOfAccount.findUniqueOrThrow({ where: { code: CATEGORY_TO_ACCOUNT_CODE[expense.category] } }),
    db.chartOfAccount.findUniqueOrThrow({ where: { code: "1000" } }),
  ]);

  await db.ledgerEntry.createMany({
    data: [
      {
        branchId: expense.branchId,
        accountId: expenseAccount.id,
        debit: expense.amount,
        credit: 0,
        refType: "EXPENSE",
        expenseId,
        description: expense.vendor ?? expense.category,
      },
      {
        branchId: expense.branchId,
        accountId: cash.id,
        debit: 0,
        credit: expense.amount,
        refType: "EXPENSE",
        expenseId,
        description: "Expense payment",
      },
    ],
  });
}

function advance(date: Date, interval: string): Date {
  const d = new Date(date);
  if (interval === "weekly") d.setDate(d.getDate() + 7);
  else if (interval === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/** Auto-generates any recurring expense instances that have come due, up to today. */
export async function generateDueRecurringExpenses(branchId: string, userId: string | null) {
  const templates = await db.expense.findMany({ where: { branchId, isRecurring: true } });
  const now = new Date();

  for (const template of templates) {
    if (!template.recurrenceInterval) continue;

    const lastInstance = await db.expense.findFirst({
      where: { recurrenceParentId: template.id },
      orderBy: { date: "desc" },
    });

    let cursor = advance(lastInstance ? lastInstance.date : template.date, template.recurrenceInterval);
    let iterations = 0;

    while (cursor <= now && iterations < 24) {
      const created = await db.expense.create({
        data: {
          branchId: template.branchId,
          category: template.category,
          amount: template.amount,
          date: cursor,
          vendor: template.vendor,
          notes: template.notes,
          isRecurring: false,
          recurrenceParentId: template.id,
          createdById: userId,
        },
      });
      await postExpenseLedger(created.id);
      cursor = advance(cursor, template.recurrenceInterval);
      iterations++;
    }
  }
}
