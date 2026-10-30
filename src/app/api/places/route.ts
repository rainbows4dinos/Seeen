import { createClient } from "@/lib/supabase/server";
import { formatPlace } from "@/lib/places";

// Town search for the location field. Runs as the signed-in user; the
// search function is closed to anonymous requests.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json([]);

  const supabase = await createClient();
  // Favor countries this workspace already has connections in.
  const { data: used } = await supabase.from("localities").select("country_code");
  const prefer = [...new Set((used ?? []).map((l) => l.country_code).filter((c): c is string => Boolean(c)))];

  const { data, error } = await supabase.rpc("search_places", {
    q: q.slice(0, 80),
    max_results: 8,
    prefer_countries: prefer,
  });
  if (error) {
    return Response.json({ error: "Search isn't working right now." }, { status: 500 });
  }

  return Response.json(
    data.map((p) => ({ id: p.id, label: formatPlace(p), name: p.name })),
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
}
