import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllowedPermissions } from "@/lib/access";
import { db } from "@/lib/db";
import Sidebar from "./Sidebar";
import MobileMenuButton from "./MobileMenuButton";
import { logout } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [allowedPermissions, branch] = await Promise.all([
    getAllowedPermissions(session.user.role),
    db.branch.findUnique({
      where: { id: session.user.branchId },
      select: { receiptPaperWidthMm: true },
    }),
  ]);
  const paperWidthMm = branch?.receiptPaperWidthMm ?? 43;

  return (
    <div className="flex min-h-screen bg-gray-50 print:block print:bg-white">
      {/* @page size is a live-editable store setting (Store Settings), not a fixed value in CSS. */}
      <style>{`@media print { @page { size: ${paperWidthMm}mm auto; margin: 0; } }`}</style>
      <div className="print:hidden">
        <Sidebar role={session.user.role} allowedPermissions={allowedPermissions} />
      </div>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 print:hidden">
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <MobileMenuButton />
            {session.user.name}
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
              {session.user.role.replace("_", " ")}
            </span>
          </span>
          <form action={logout}>
            <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          </form>
        </header>
        <main className="p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
