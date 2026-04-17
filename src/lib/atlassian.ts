import { createClient } from "@/lib/supabase/server";
import { normalizeAtlassianDomain } from "@/lib/utils";

export async function getAtlassianAuth(type: "jira" | "confluence") {
  const supabase = await createClient();
  const { data } = await supabase.from("integrations").select("*").eq("type", type).single();
  if (!data) return null;
  const domain = normalizeAtlassianDomain(data.domain);
  const token = Buffer.from(`${data.email}:${data.api_token}`).toString("base64");
  return {
    domain,
    token,
    headers: { Authorization: `Basic ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    data,
  };
}
