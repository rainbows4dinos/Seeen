import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMembership } from "@/lib/auth/dal";
import { listScenes, nestScenes, type SceneItem } from "@/lib/scenes/queries";
import { formatLocality } from "@/lib/connections/labels";
import { NoWorkspace } from "@/components/no-workspace";

export const metadata: Metadata = { title: "Scenes · Seeen" };

export default function ScenesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Scenes</h1>
        <Link href="/scenes/new" className="button-primary">
          New scene
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted">Loading scenes…</p>}>
        <Scenes />
      </Suspense>
    </div>
  );
}

async function Scenes() {
  const membership = await getMembership();
  if (!membership) return <NoWorkspace />;
  const scenes = await listScenes();

  if (!scenes.length) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-line p-6">
        <p className="font-medium">No scenes yet.</p>
        <p className="text-muted">
          Scenes group connections by local community, like &ldquo;Portland
          DIY.&rdquo; Put local scenes inside a bigger one, like &ldquo;Pacific
          Northwest,&rdquo; to see a whole region at once.
        </p>
        <Link href="/scenes/new" className="button-secondary">
          Add your first scene
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-line border-y border-line">
      {nestScenes(scenes).map(({ scene, children }) => (
        <li key={scene.id} className="py-3">
          <SceneRow
            scene={scene}
            total={
              new Set([scene, ...children].flatMap((s) => s.connectionIds)).size
            }
            hasChildren={children.length > 0}
          />
          {children.length ? (
            <ul className="mt-2 flex flex-col gap-2 border-l-2 border-line pl-4">
              {children.map((c) => (
                <li key={c.id}>
                  <SceneRow scene={c} total={c.count} hasChildren={false} />
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SceneRow({
  scene,
  total,
  hasChildren,
}: {
  scene: SceneItem;
  total: number;
  hasChildren: boolean;
}) {
  const place = formatLocality(scene.localities);
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <p>
        <Link href={`/?scene=${scene.id}`} className="link font-semibold">
          {scene.name}
        </Link>
        <span className="text-sm text-muted">
          {[
            place,
            `${total} ${total === 1 ? "connection" : "connections"}${hasChildren ? " across its scenes" : ""}`,
          ]
            .filter(Boolean)
            .map((t) => ` · ${t}`)
            .join("")}
        </span>
        {scene.description ? (
          <span className="block text-sm text-muted">{scene.description}</span>
        ) : null}
      </p>
      <Link href={`/scenes/${scene.id}`} className="link text-sm">
        Edit<span className="sr-only"> {scene.name}</span>
      </Link>
    </div>
  );
}
