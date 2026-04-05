import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/lib/db";
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
];

export default async function TeamPage() {
  const MOCK_PROJECTS = await getProjects();
  // Deduplicate team members across projects
  const allMembers = Array.from(
    new Map(
      MOCK_PROJECTS.flatMap((p) => p.team).map((m) => [m.id, m])
    ).values()
  );

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Team" subtitle={`${allMembers.length} members`} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-gray-900">All Members</h2>
            <Button size="sm">
              <UserPlus size={14} />
              Invite Member
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {allMembers.map((member, i) => {
              const memberProjects = MOCK_PROJECTS.filter((p) =>
                p.team.some((t) => t.id === member.id)
              );
              const totalTasks = MOCK_PROJECTS.flatMap((p) =>
                p.tasks.filter((t) => t.assignee === member.name)
              ).length;

              return (
                <Card key={member.id}>
                  <CardContent className="py-5">
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
                          <h3 className="font-semibold text-gray-900">
                            {member.name}
                          </h3>
                          <Badge className={ROLE_COLORS[member.role]}>
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                          <Mail size={12} />
                          {member.email}
                        </p>
                        <div className="flex gap-3 mt-3 text-xs text-gray-500">
                          <span>
                            <span className="font-semibold text-gray-900">
                              {memberProjects.length}
                            </span>{" "}
                            projects
                          </span>
                          <span>
                            <span className="font-semibold text-gray-900">
                              {totalTasks}
                            </span>{" "}
                            tasks
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {memberProjects.map((p) => (
                            <span
                              key={p.id}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
