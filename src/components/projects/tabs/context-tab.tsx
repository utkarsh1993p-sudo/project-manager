import type { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, Circle, AlertCircle } from "lucide-react";

const MILESTONE_ICONS = {
  completed: CheckCircle2,
  "in-progress": Clock,
  upcoming: Circle,
  delayed: AlertCircle,
};

const MILESTONE_COLORS = {
  completed: "text-green-500",
  "in-progress": "text-blue-500",
  upcoming: "text-gray-400",
  delayed: "text-red-500",
};

const INFLUENCE_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

interface ContextTabProps {
  project: Project;
}

export function ContextTab({ project }: ContextTabProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Project Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {project.goals.map((goal, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700">{goal}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline & Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.timeline.map((milestone) => {
                const Icon = MILESTONE_ICONS[milestone.status];
                const color = MILESTONE_COLORS[milestone.status];
                return (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-3"
                  >
                    <Icon size={18} className={color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {milestone.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(milestone.dueDate)}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs ${
                        milestone.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : milestone.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : milestone.status === "delayed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stakeholders */}
      <Card>
        <CardHeader>
          <CardTitle>Stakeholders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Influence
                  </th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Interest
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {project.stakeholders.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {s.name}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{s.role}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">
                      {s.email}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={INFLUENCE_COLORS[s.influence]}>
                        {s.influence}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge className={INFLUENCE_COLORS[s.interest]}>
                        {s.interest}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
