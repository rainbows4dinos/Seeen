import type { Metadata } from "next";
import { Suspense } from "react";
import { getMembership } from "@/lib/auth/dal";
import { createConnection } from "@/lib/connections/actions";
import { EMPTY_FORM } from "@/lib/connections/form";
import { ConnectionForm } from "@/components/connection-form";
import { NoWorkspace } from "@/components/no-workspace";

export const metadata: Metadata = { title: "Add connection · Seeen" };

export default function NewConnectionPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Add connection</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <NewConnection />
      </Suspense>
    </div>
  );
}

async function NewConnection() {
  const membership = await getMembership();
  if (!membership) return <NoWorkspace />;

  return (
    <ConnectionForm
      action={createConnection}
      initial={EMPTY_FORM}
      submitLabel="Add connection"
      cancelHref="/"
    />
  );
}
