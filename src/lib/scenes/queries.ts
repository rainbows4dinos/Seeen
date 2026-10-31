import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SCENE_FIELDS =
  "id, name, description, parent_id, locality_id, localities ( name, region, region_code, country, country_code, place_id ), connection_scenes ( connection_id )";

function withCount<
  T extends { connection_scenes: { connection_id: string }[] },
>(s: T) {
  return {
    ...s,
    connectionIds: s.connection_scenes.map((cs) => cs.connection_id),
    count: s.connection_scenes.length,
  };
}

export async function listScenes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenes")
    .select(SCENE_FIELDS)
    .order("name");
  if (error) throw new Error("Couldn't load scenes.");
  return data.map(withCount);
}

export type SceneItem = Awaited<ReturnType<typeof listScenes>>[number];

export async function getScene(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenes")
    .select(SCENE_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error?.code === "22P02") notFound();
  if (error) throw new Error("Couldn't load this scene.");
  if (!data) notFound();
  return withCount(data);
}

// Top-level scenes first, each followed by the scenes inside it.
export function nestScenes<T extends { id: string; parent_id: string | null }>(
  scenes: T[],
) {
  const top = scenes.filter(
    (s) => !s.parent_id || !scenes.some((p) => p.id === s.parent_id),
  );
  return top.map((s) => ({
    scene: s,
    children: scenes.filter((c) => c.parent_id === s.id),
  }));
}

// A scene plus everything inside it, for "show me the Pacific Northwest".
export function sceneAndChildren(
  scenes: { id: string; parent_id: string | null }[],
  id: string,
) {
  return new Set([
    id,
    ...scenes.filter((s) => s.parent_id === id).map((s) => s.id),
  ]);
}
