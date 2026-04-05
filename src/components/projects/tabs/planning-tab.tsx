import type { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_TEMPLATES } from "@/lib/mock-data";
import { Users, FileText, MessageSquare, Copy } from "lucide-react";

interface PlanningTabProps {
  project: Project;
}

const PLANNING_TOOLS = [
  {
    id: "stakeholder-update",
    icon: Users,
    title: "Draft Stakeholder Update",
    description: "Generate a stakeholder update email based on current project status, recent milestones, and upcoming priorities.",
    color: "bg-blue-50 border-blue-200",
    action: "Generate Update",
  },
  {
    id: "exec-summary",
    icon: FileText,
    title: "Prepare Executive Summary",
    description: "Create a concise executive summary covering status, budget, timeline, and key decisions needed.",
    color: "bg-purple-50 border-purple-200",
    action: "Generate Summary",
  },
  {
    id: "pushback",
    icon: MessageSquare,
    title: "Simulate Pushback",
    description: "Anticipate stakeholder objections and prepare your responses before the meeting.",
    color: "bg-orange-50 border-orange-200",
    action: "Simulate",
  },
];

export function PlanningTab({ project }: PlanningTabProps) {
  const planningTemplates = MOCK_TEMPLATES.filter(
    (t) => t.category === "stakeholder" || t.category === "planning" || t.category === "communication"
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Planning tools */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Planning Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {PLANNING_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className={`rounded-xl border p-4 ${tool.color}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Icon size={18} className="text-gray-700 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="w-full">
                  {tool.action}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project snapshot for planning */}
      <Card>
        <CardHeader>
          <CardTitle>Project Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Goals
              </p>
              <ul className="space-y-1.5">
                {project.goals.map((goal, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">
                      {i + 1}
                    </span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Key Stakeholders
              </p>
              <ul className="space-y-1.5">
                {project.stakeholders.filter((s) => s.influence === "high").map((s) => (
                  <li key={s.id} className="text-sm text-gray-700">
                    <span className="font-medium">{s.name}</span> — {s.role}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Upcoming Milestones
              </p>
              <ul className="space-y-1.5">
                {project.timeline
                  .filter((m) => m.status !== "completed")
                  .slice(0, 3)
                  .map((m) => (
                    <li key={m.id} className="text-sm text-gray-700">
                      {m.title}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Planning Templates
        </h2>
        <div className="space-y-3">
          {planningTemplates.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {t.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                    <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-lg p-2 font-mono">
                      {t.prompt}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <Copy size={14} />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
