import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjects } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import {
  ArrowRight,
  Target,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Zap,
  RefreshCw,
  Settings2,
  Rocket,
  Sparkles,
  Link2,
} from "lucide-react";

const WORKFLOW_STEPS = [
  {
    label: "START",
    title: "Use Claude as a Project Partner",
    bullets: [
      "Use Co-Work mode (desktop)",
      "Connect it to your project files",
      "Treat it like part of your team",
    ],
    note: "Setup once. Reuse across projects.",
    color: "bg-green-50 border-green-200",
    labelColor: "bg-green-500",
    icon: Zap,
  },
  {
    label: "Step 2",
    title: "Load Your Project Context",
    bullets: ["Project goals", "Stakeholders", "Timeline", "Risks"],
    note: "Claude works from your context.",
    color: "bg-yellow-50 border-yellow-200",
    labelColor: "bg-yellow-500",
    icon: FileText,
  },
  {
    label: "Step 3",
    title: "Define How Claude Should Work",
    bullets: [
      "Read files before answering",
      "Ask questions first",
      "Break work into steps",
    ],
    note: "Guide the thinking, not just output.",
    color: "bg-yellow-50 border-yellow-200",
    labelColor: "bg-yellow-500",
    icon: Settings2,
  },
  {
    label: "Step 4",
    title: "Build Your Project Workspace",
    bullets: [
      "project-overview.md",
      "stakeholder-map.md",
      "risk-log.md",
      "action-plan.md",
    ],
    note: "Your files become Claude's system.",
    color: "bg-blue-50 border-blue-200",
    labelColor: "bg-blue-500",
    icon: Target,
  },
  {
    label: "Step 5",
    title: "Use Claude for Planning",
    bullets: [
      "Draft stakeholder updates",
      "Prepare executive summaries",
      "Simulate pushback",
    ],
    note: "Faster structured planning.",
    color: "bg-blue-50 border-blue-200",
    labelColor: "bg-blue-500",
    icon: TrendingUp,
  },
  {
    label: "Step 6",
    title: "Claude for Alignment & Decisions",
    bullets: ["Break down scope", "Build timelines", "Identify dependencies"],
    note: "Better conversations, faster decisions.",
    color: "bg-purple-50 border-purple-200",
    labelColor: "bg-purple-500",
    icon: Users,
  },
  {
    label: "Step 7",
    title: "Manage Risk & Adjust Execution",
    bullets: [
      "Update plans in real-time",
      "Adjust timelines",
      "Refine deliverables",
    ],
    note: "Claude Co-Work can update your project files.",
    color: "bg-red-50 border-red-200",
    labelColor: "bg-red-500",
    icon: AlertTriangle,
  },
  {
    label: "Step 8",
    title: "Correct and Iterate",
    bullets: ["Identify what's off", "Refine outputs", "Improve direction"],
    note: "Iterate, don't restart.",
    color: "bg-red-50 border-red-200",
    labelColor: "bg-red-500",
    icon: RefreshCw,
  },
  {
    label: "Step 9",
    title: "Standardize Your Workflow",
    bullets: [
      "Reuse prompts",
      "Build templates",
      "Automate recurring work",
    ],
    note: "Efficiency compounds over time.",
    color: "bg-blue-50 border-blue-200",
    labelColor: "bg-blue-500",
    icon: Settings2,
  },
  {
    label: "FINISH",
    title: "Run Projects With Leverage",
    bullets: [
      "Faster planning",
      "Better communication",
      "Stronger execution",
      "Less manual effort",
    ],
    note: "Claude amplifies your execution.",
    color: "bg-teal-50 border-teal-200",
    labelColor: "bg-teal-500",
    icon: Rocket,
  },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  planning: "bg-blue-100 text-blue-700",
  "on-hold": "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
};

export default async function DashboardPage() {
  const MOCK_PROJECTS = await getProjects();
  const supabase = await createClient();
  const { data: integrations } = await supabase
    .from("integrations")
    .select("type, domain, jira_project_key, confluence_space_key");

  const jiraIntegration = integrations?.find((i) => i.type === "jira") ?? null;
  const confluenceIntegration = integrations?.find((i) => i.type === "confluence") ?? null;

  const totalTasks = MOCK_PROJECTS.flatMap((p) => p.tasks).length;
  const openRisks = MOCK_PROJECTS.flatMap((p) =>
    p.risks.filter((r) => r.status === "open")
  ).length;
  const activeCount = MOCK_PROJECTS.filter((p) => p.status === "active").length;

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Dashboard"
          subtitle="AI-powered project management from context to execution"
        />
        <main className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: "Total Projects",
                value: MOCK_PROJECTS.length,
                icon: Target,
                color: "text-blue-600 bg-blue-50",
              },
              {
                label: "Active Projects",
                value: activeCount,
                icon: TrendingUp,
                color: "text-green-600 bg-green-50",
              },
              {
                label: "Open Tasks",
                value: totalTasks,
                icon: CheckCircle2,
                color: "text-purple-600 bg-purple-50",
              },
              {
                label: "Open Risks",
                value: openRisks,
                icon: AlertTriangle,
                color: "text-red-600 bg-red-50",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-4 py-5">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Integrations + AI strip */}
          <div className="grid grid-cols-3 gap-4">
            {/* JIRA */}
            <Card className={jiraIntegration ? "border-blue-200 bg-blue-50" : ""}>
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">J</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">JIRA</p>
                  {jiraIntegration ? (
                    <p className="text-xs text-blue-700">
                      {jiraIntegration.domain} · {jiraIntegration.jira_project_key}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Not connected</p>
                  )}
                </div>
                <Badge className={jiraIntegration ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                  {jiraIntegration ? "Live" : "Setup"}
                </Badge>
              </CardContent>
            </Card>

            {/* Confluence */}
            <Card className={confluenceIntegration ? "border-blue-200 bg-blue-50" : ""}>
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Confluence</p>
                  {confluenceIntegration ? (
                    <p className="text-xs text-blue-700">
                      {confluenceIntegration.domain}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Not connected</p>
                  )}
                </div>
                <Badge className={confluenceIntegration ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                  {confluenceIntegration ? "Live" : "Setup"}
                </Badge>
              </CardContent>
            </Card>

            {/* AI */}
            <Card className="border-purple-200 bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">AI Assistant</p>
                  <p className="text-xs text-purple-700">GPT-4o · 8 actions</p>
                </div>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Integration quick links */}
          {(jiraIntegration || confluenceIntegration) && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Link2 size={12} />
              <span>Integrations active:</span>
              {jiraIntegration && (
                <a
                  href={`https://${jiraIntegration.domain}.atlassian.net/jira/software/projects/${jiraIntegration.jira_project_key}/boards`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  JIRA ({jiraIntegration.jira_project_key})
                </a>
              )}
              {jiraIntegration && confluenceIntegration && <span>·</span>}
              {confluenceIntegration && (
                <a
                  href={`https://${confluenceIntegration.domain}.atlassian.net/wiki`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Confluence
                </a>
              )}
              <span>·</span>
              <Link href="/settings" className="text-blue-600 hover:underline">Manage integrations</Link>
            </div>
          )}

          {/* Projects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Your Projects
              </h2>
              <Link
                href="/projects"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {MOCK_PROJECTS.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="py-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                            {project.description}
                          </p>
                        </div>
                        <Badge
                          className={`ml-3 shrink-0 ${STATUS_STYLES[project.status]}`}
                        >
                          {project.status}
                        </Badge>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {project.team.length} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Due {formatDate(project.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={12} />
                          {
                            project.risks.filter((r) => r.status === "open")
                              .length
                          }{" "}
                          risks
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* 9-Step Workflow */}
          <section>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                How to Use Claude AI to Run Projects
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                From context to execution — stop using AI for answers, start
                using it to run your projects.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {WORKFLOW_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className={`rounded-xl border p-4 ${step.color}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-block text-white text-xs font-bold px-2 py-0.5 rounded-full ${step.labelColor}`}
                          >
                            {step.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-2">
                          {step.title}
                        </h3>
                        <ul className="space-y-0.5">
                          {step.bullets.map((b) => (
                            <li
                              key={b}
                              className="text-xs text-gray-700 flex items-start gap-1.5"
                            >
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          {step.note}
                        </p>
                      </div>
                      <Icon size={20} className="text-gray-400 shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 text-white text-center py-4 px-6">
              <p className="font-semibold text-sm">
                Stop using AI for answers. Start using it to run your projects.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
