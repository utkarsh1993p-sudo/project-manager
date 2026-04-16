import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { IntegrationsSettings } from "@/components/integrations/integrations-settings";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: integrations } = await supabase
    .from("integrations")
    .select("id, type, domain, email, jira_project_key, confluence_space_key");

  const jira = integrations?.find((i) => i.type === "jira") ?? null;
  const confluence = integrations?.find((i) => i.type === "confluence") ?? null;
  const sharepoint = integrations?.find((i) => i.type === "sharepoint") ?? null;

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Settings" subtitle="Manage integrations and preferences" />
        <main className="flex-1 overflow-y-auto p-6">
          <IntegrationsSettings jira={jira} confluence={confluence} sharepoint={sharepoint} />
        </main>
      </div>
    </div>
  );
}
