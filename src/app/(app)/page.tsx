import Link from "next/link";
import { Suspense } from "react";
import { getMembership } from "@/lib/auth/dal";
import { listConnections } from "@/lib/connections/queries";
import { STAGE_LABELS, formatLocality, formatTypes } from "@/lib/connections/labels";
import { NoWorkspace } from "@/components/no-workspace";

export default function DirectoryPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading the directory…</p>}>
      <Directory searchParams={searchParams} />
    </Suspense>
  );
}

async function Directory({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const membership = await getMembership();
  if (!membership) return <NoWorkspace />;

  const { view } = await searchParams;
  const archived = view === "archived";
  const connections = await listConnections({ archived });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Directory</h1>
        <Link href="/connections/new" className="button-primary">
          Add connection
        </Link>
      </div>

      <nav aria-label="Directory views" className="flex gap-4 text-sm">
        <ViewLink href="/" current={!archived}>
          Current
        </ViewLink>
        <ViewLink href="/?view=archived" current={archived}>
          Archived
        </ViewLink>
      </nav>

      {connections.length === 0 ? (
        archived ? (
          <p className="text-muted">Nothing archived.</p>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-line p-6">
            <p className="font-medium">No connections yet.</p>
            <p className="text-muted">
              Start with a band you&rsquo;ve shared a bill with, a venue you&rsquo;ve played, or someone
              you&rsquo;d like to meet.
            </p>
            <Link href="/connections/new" className="button-secondary">
              Add your first connection
            </Link>
          </div>
        )
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            {connections.length} {connections.length === 1 ? "connection" : "connections"}
          </p>
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {connections.map((c) => {
              const place = formatLocality(c.localities);
              return (
                <li key={c.id}>
                  <Link
                    href={`/connections/${c.id}`}
                    className="flex flex-col gap-1 py-3 hover:bg-line/30 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <span className="flex flex-col">
                      <span className="font-semibold break-words">{c.name}</span>
                      <span className="text-sm text-muted">{formatTypes(c.types)}</span>
                    </span>
                    <span className="flex flex-wrap gap-x-3 text-sm text-muted sm:justify-end">
                      {place ? <span>{place}</span> : null}
                      <span>{STAGE_LABELS[c.stage]}</span>
                      {c.reach_out === "pass" ? <span>Passed</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function ViewLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={
        current
          ? "border-b-2 border-foreground pb-1 font-semibold"
          : "border-b-2 border-transparent pb-1 text-muted hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}
