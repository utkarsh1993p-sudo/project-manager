import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjects } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Users, Clock, AlertTriangle, Target } from "lucide-react";
import { NewProjectButton } from "@/components/projects/new-project-button";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  planning: "bg-blue-100 text-blue-700",
  "on-hold": "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
};

export default async function ProjectsPage() {
  const MOCK_PROJECTS = await getProjects();

  const supabase = await createClient();
  const { data: integrations } = await supabase
    .from("integrations")
    .select("type, domain, jira_project_key, confluence_space_key");
  const jira = integrations?.find((i) => i.type === "jira");
  const confluence = integrations?.find((i) => i.type === "confluence");
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Projects" subtitle={`${MOCK_PROJECTS.length} projects`} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="flex gap-2 flex-wrap flex-1">
              {["All", "Active", "Planning", "On Hold", "Completed"].map(
                (filter) => (
                  <button
                    key={filter}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filter === "All"
                        ? "bg-gray-900 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {filter}
                  </button>
                )
              )}
            </div>
            <NewProjectButton
              jiraConnected={!!jira}
              jiraProjectKey={jira?.jira_project_key ?? ""}
              confluenceConnected={!!confluence}
              confluenceSpaceKey={confluence?.confluence_space_key ?? ""}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {MOCK_PROJECTS.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="py-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Target size={18} className="text-white" />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {project.description}
                            </p>
                          </div>
                          <Badge
                            className={`shrink-0 ${STATUS_STYLES[project.status]}`}
                          >
                            {project.status}
                          </Badge>
                        </div>

                        {/* Goals preview */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {project.goals.slice(0, 2).map((goal) => (
                            <span
                              key={goal}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-xs"
                            >
                              {goal}
                            </span>
                          ))}
                          {project.goals.length > 2 && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              +{project.goals.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex shrink-0 flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Progress</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {project.progress}%
                          </p>
                        </div>
                        <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {project.team.length}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={12} />
                            {
                              project.risks.filter((r) => r.status === "open")
                                .length
                            }
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(project.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
