import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllowedPermissions } from "@/lib/access";
import Sidebar from "./Sidebar";
import { logout } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const allowedPermissions = await getAllowedPermissions(session.user.role);

  return (
    <div className="flex min-h-screen bg-gray-50 print:block print:bg-white">
      <div className="print:hidden">
        <Sidebar role={session.user.role} allowedPermissions={allowedPermissions} />
      </div>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 print:hidden">
          <span className="flex items-center gap-2 text-sm text-gray-600">
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
