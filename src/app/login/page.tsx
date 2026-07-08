import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo size="md" />
        </div>
        <h1 className="mb-6 text-center text-lg font-semibold text-gray-900">Staff Sign In</h1>
        <LoginForm callbackUrl={callbackUrl || "/dashboard"} />
      </div>
    </div>
  );
}
