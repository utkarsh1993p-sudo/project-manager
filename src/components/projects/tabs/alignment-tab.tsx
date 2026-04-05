import type { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Clock, Link2 } from "lucide-react";

const DEP_STATUS: Record<string, string> = {
  resolved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  blocked: "bg-red-100 text-red-700",
};

const DEP_ICONS = {
  resolved: CheckCircle2,
  pending: Clock,
  blocked: AlertCircle,
};

interface AlignmentTabProps {
  project: Project;
}

export function AlignmentTab({ project }: AlignmentTabProps) {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Scope breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Scope Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-4">
              Break down scope into deliverables and track alignment across teams.
            </p>
            <div className="space-y-3">
              {project.goals.map((goal, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{goal}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(i + 1) * 20 + 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {(i + 1) * 20 + 10}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-4">
                {project.timeline.map((milestone, i) => (
                  <div key={milestone.id} className="flex items-start gap-4 pl-8 relative">
                    <div
                      className={`absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        milestone.status === "completed"
                          ? "bg-green-500 border-green-500"
                          : milestone.status === "in-progress"
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {milestone.status === "completed" && (
                        <CheckCircle2 size={12} className="text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {milestone.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(milestone.dueDate)}
                      </p>
                    </div>
                    <Badge
                      className={`ml-auto shrink-0 text-xs ${
                        milestone.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : milestone.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dependencies */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-gray-500" />
            <CardTitle>Dependencies</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {project.dependencies.length === 0 ? (
            <p className="text-sm text-gray-500">No dependencies identified yet.</p>
          ) : (
            <div className="space-y-3">
              {project.dependencies.map((dep) => {
                const Icon = DEP_ICONS[dep.status];
                return (
                  <div
                    key={dep.id}
                    className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <Icon
                      size={18}
                      className={
                        dep.status === "resolved"
                          ? "text-green-500"
                          : dep.status === "blocked"
                          ? "text-red-500"
                          : "text-yellow-500"
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {dep.title}
                        </p>
                        <Badge className="text-xs bg-gray-100 text-gray-600">
                          {dep.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {dep.description}
                      </p>
                    </div>
                    <Badge className={`shrink-0 ${DEP_STATUS[dep.status]}`}>
                      {dep.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
