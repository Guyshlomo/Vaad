import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type PushType = "issue_created" | "issue_status" | "announcement";

type RequestBody = {
  type: PushType;
  building_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  exclude_user_id?: string;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const chunk = <T>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "Missing Supabase env vars" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json(401, { error: "Missing Authorization header" });

  let payload: RequestBody;
  try {
    payload = (await req.json()) as RequestBody;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  if (!payload?.type || !payload?.building_id || !payload?.title || !payload?.body) {
    return json(400, { error: "Missing required fields" });
  }

  // Auth client (validates caller JWT)
  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
  if (userErr || !userData?.user) return json(401, { error: "Invalid user token" });

  // Service client (RLS bypass) for querying tokens + profiles/settings
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Verify caller belongs to the building and optionally is committee for certain actions
  const { data: callerProfile, error: callerProfileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, building_id, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (callerProfileErr || !callerProfile?.building_id) {
    return json(403, { error: "Caller profile not found" });
  }
  if (callerProfile.building_id !== payload.building_id) {
    return json(403, { error: "Caller not in building" });
  }
  if ((payload.type === "issue_status" || payload.type === "announcement") && callerProfile.role !== "committee") {
    return json(403, { error: "Committee only" });
  }

  const { data: rows, error: rowsErr } = await supabaseAdmin
    .from("push_tokens")
    .select(
      "token, user_id, profiles!inner(building_id), user_settings(push_issues, push_announcements, push_status_updates)"
    )
    .eq("profiles.building_id", payload.building_id);

  if (rowsErr) return json(500, { error: rowsErr.message });

  const desiredFlag = (row: any) => {
    const s = row?.user_settings?.[0] ?? row?.user_settings ?? null;
    const issues = s?.push_issues ?? true;
    const announcements = s?.push_announcements ?? true;
    const status = s?.push_status_updates ?? true;
    if (payload.type === "issue_created") return issues;
    if (payload.type === "issue_status") return status;
    return announcements;
  };

  const exclude = payload.exclude_user_id;
  const tokens = Array.from(
    new Set(
      (rows ?? [])
        .filter((r: any) => r?.token)
        .filter((r: any) => !exclude || r.user_id !== exclude)
        .filter((r: any) => desiredFlag(r))
        .map((r: any) => r.token as string)
    )
  );

  if (tokens.length === 0) return json(200, { ok: true, sent: 0 });

  // Expo push: max 100 messages per request
  const expoMessages = tokens.map((to) => ({
    to,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }));

  const batches = chunk(expoMessages, 100);
  let sent = 0;
  const results: unknown[] = [];

  for (const batch of batches) {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    const text = await res.text();
    results.push({ status: res.status, body: text });
    if (res.ok) sent += batch.length;
  }

  return json(200, { ok: true, sent, batches: batches.length, results });
});


