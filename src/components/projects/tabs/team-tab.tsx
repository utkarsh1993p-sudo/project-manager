import type { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, Mail } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  member: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-600",
};

const AVATAR_COLORS = [
  "from-blue-500 to-purple-600",
  "from-green-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-yellow-500 to-orange-600",
];

interface TeamTabProps {
  project: Project;
}

export function TeamTab({ project }: TeamTabProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Team Members</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {project.team.length} members on this project
          </p>
        </div>
        <Button size="sm">
          <UserPlus size={14} />
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {project.team.map((member, i) => (
          <Card key={member.id}>
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                    AVATAR_COLORS[i % AVATAR_COLORS.length]
                  } flex items-center justify-center text-white font-bold text-lg shrink-0`}
                >
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <Badge className={ROLE_COLORS[member.role]}>
                      {member.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                    <Mail size={12} />
                    {member.email}
                  </p>

                  {/* Task count */}
                  <div className="mt-2 text-xs text-gray-500">
                    {
                      project.tasks.filter((t) => t.assignee === member.name)
                        .length
                    }{" "}
                    tasks assigned
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stakeholders section */}
      <Card>
        <CardHeader>
          <CardTitle>External Stakeholders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.stakeholders.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.role}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Influence:</span>
                  <Badge
                    className={
                      s.influence === "high"
                        ? "bg-red-100 text-red-700"
                        : s.influence === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }
                  >
                    {s.influence}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
