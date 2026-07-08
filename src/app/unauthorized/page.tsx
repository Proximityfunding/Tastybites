import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Not authorized</h1>
      <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
      <Link href="/dashboard" className="text-orange-600 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
