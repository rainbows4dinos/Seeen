import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser, getMembership } from "@/lib/auth/dal";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Seeen
          </Link>
          <Suspense fallback={<span className="text-sm text-muted">Loading…</span>}>
            <Account />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}

async function Account() {
  const [user, membership] = await Promise.all([getCurrentUser(), getMembership()]);
  const name = membership?.displayName ?? user.email ?? "you";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm">
        {membership ? (
          <>
            <span className="font-medium">{membership.workspaceName}</span>
            <span className="text-muted"> · {name}</span>
          </>
        ) : (
          <span className="text-muted break-all">{name}</span>
        )}
      </p>
      <form action="/auth/signout" method="post">
        <button type="submit" className="button-secondary">
          Sign out
        </button>
      </form>
    </div>
  );
}
