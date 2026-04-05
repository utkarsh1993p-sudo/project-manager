import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getProjects } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const [projects, supabase] = await Promise.all([
    getProjects(),
    createClient(),
  ]);

  const { data: integrations } = await supabase
    .from("integrations")
    .select("type, domain, jira_project_key, confluence_space_key");

  const jira = integrations?.find((i) => i.type === "jira") ?? null;
  const confluence = integrations?.find((i) => i.type === "confluence") ?? null;

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Dashboard"
          subtitle="AI-powered project management from context to execution"
        />
        <DashboardClient
          projects={projects}
          jiraConnected={!!jira}
          confluenceConnected={!!confluence}
          jiraDomain={jira?.domain}
          jiraKey={jira?.jira_project_key}
          confluenceDomain={confluence?.domain}
        />
      </div>
    </div>
  );
}
