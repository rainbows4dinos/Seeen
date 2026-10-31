import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser, getMembership } from "@/lib/auth/dal";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Seeen
            </Link>
            <nav aria-label="Main" className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
              <Link href="/" className="action-link">
                Directory
              </Link>
              <Link href="/scenes" className="action-link">
                Scenes
              </Link>
              <Link href="/follow-ups" className="action-link">
                Follow-ups
              </Link>
            </nav>
          </div>
          <Suspense fallback={<span className="text-sm text-muted">Loading…</span>}>
            <Account />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-line">
        <p className="mx-auto w-full max-w-3xl px-4 py-4 text-xs text-muted">
          Town data from{" "}
          <a href="https://www.geonames.org/" className="link" target="_blank" rel="noopener noreferrer">
            GeoNames
          </a>{" "}
          (
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="link"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY 4.0
          </a>
          ).
        </p>
      </footer>
    </div>
  );
}

async function Account() {
  const user = await getCurrentUser();
  // The header shouldn't take the page down if the workspace can't load;
  // the page's own error state explains what happened.
  const membership = await getMembership().catch(() => null);
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
