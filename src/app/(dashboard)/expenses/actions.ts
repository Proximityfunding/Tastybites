"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/access";
import { pesosToCentavos } from "@/lib/money";
import { saveUploadedFile } from "@/lib/upload";
import { postExpenseLedger } from "@/lib/expenses";
import { logAudit } from "@/lib/audit";
import type { ExpenseCategory } from "@prisma/client";

export async function createExpense(formData: FormData) {
  const user = await requireRole("OWNER_ADMIN");
  const category = String(formData.get("category") || "") as ExpenseCategory;
  const amount = pesosToCentavos(Number(formData.get("amount") || 0));
  const date = new Date(String(formData.get("date") || ""));
  if (!category || !amount || Number.isNaN(date.getTime())) {
    throw new Error("Category, amount, and date are required");
  }

  const receiptFile = formData.get("receipt") as File | null;
  const receiptUrl = await saveUploadedFile(receiptFile, "receipts");
  const isRecurring = formData.get("isRecurring") === "on";
  const recurrenceInterval = isRecurring ? String(formData.get("recurrenceInterval") || "monthly") : null;

  const expense = await db.expense.create({
    data: {
      branchId: user.branchId,
      category,
      amount,
      date,
      vendor: String(formData.get("vendor") || "").trim() || null,
      receiptUrl,
      notes: String(formData.get("notes") || "").trim() || null,
      isRecurring,
      recurrenceInterval,
      createdById: user.id,
    },
  });

  await postExpenseLedger(expense.id);

  await logAudit({
    userId: user.id,
    action: "EXPENSE_CREATE",
    entityType: "Expense",
    entityId: expense.id,
    after: { category: expense.category, amount: expense.amount, vendor: expense.vendor },
  });

  revalidatePath("/expenses");
  revalidatePath("/pnl");
  revalidatePath("/reports");
  redirect("/expenses");
}
