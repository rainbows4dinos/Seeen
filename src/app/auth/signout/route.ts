import { createClient } from "@/lib/supabase/server";

// Sign out with a full page load, not a client-side redirect. The router keeps
// previously visited pages in the DOM (hidden); a document navigation drops
// them so no private data lingers after sign-out on a shared device.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/login", request.url).toString(),
      "Cache-Control": "no-store",
      // Also ask the browser to drop any cached pages for this site.
      "Clear-Site-Data": '"cache"',
    },
  });
}
