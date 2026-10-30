import { Suspense } from "react";
import { getCurrentUser, getMembership } from "@/lib/auth/dal";
import { signOut } from "@/lib/auth/actions";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
      <Suspense fallback={<p className="text-muted">Loading your workspace…</p>}>
        <Workspace />
      </Suspense>
    </main>
  );
}

async function Workspace() {
  const [user, membership] = await Promise.all([getCurrentUser(), getMembership()]);

  if (!membership) {
    return (
      <>
        <AccountBar email={user.email} />
        <section className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">No workspace yet</h1>
          <p>
            You&rsquo;re signed in, but your account hasn&rsquo;t been added to a band&rsquo;s
            workspace. Ask a bandmate who owns the workspace to add you.
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <AccountBar email={user.email} name={membership.displayName} />
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{membership.workspaceName}</h1>
        <p className="text-muted">Your people. Your scenes.</p>
        <p>The directory is coming next.</p>
      </section>
    </>
  );
}

function AccountBar({ email, name }: { email: string | null; name?: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <p className="text-sm">
        <span className="text-muted">Signed in as </span>
        <span className="font-medium break-all">{name ?? email ?? "you"}</span>
      </p>
      <form action={signOut}>
        <button type="submit" className="button-secondary">
          Sign out
        </button>
      </form>
    </header>
  );
}
