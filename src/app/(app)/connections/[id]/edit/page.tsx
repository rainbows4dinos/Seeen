import type { Metadata } from "next";
import { Suspense } from "react";
import { getMembership } from "@/lib/auth/dal";
import { updateConnection } from "@/lib/connections/actions";
import { getConnection, listLocalities, toFormValues } from "@/lib/connections/queries";
import { ConnectionForm } from "@/components/connection-form";
import { NoWorkspace } from "@/components/no-workspace";

export const metadata: Metadata = { title: "Edit connection · Seeen" };

export default function EditConnectionPage({ params }: PageProps<"/connections/[id]/edit">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <EditConnection params={params} />
    </Suspense>
  );
}

async function EditConnection({ params }: { params: PageProps<"/connections/[id]/edit">["params"] }) {
  const membership = await getMembership();
  if (!membership) return <NoWorkspace />;

  const { id } = await params;
  const [{ connection }, places] = await Promise.all([getConnection(id), listLocalities()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight break-words">Edit {connection.name}</h1>
      <ConnectionForm
        action={updateConnection.bind(null, id)}
        initial={toFormValues(connection)}
        submitLabel="Save changes"
        cancelHref={`/connections/${id}`}
        places={places}
      />
    </div>
  );
}
