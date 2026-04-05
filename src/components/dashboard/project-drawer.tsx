"use client";

import type { Project } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, getRiskColor, getStatusColor } from "@/lib/utils";
import {
  Target, Users, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, Calendar,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  planning: "bg-blue-100 text-blue-700",
  "on-hold": "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  "in-progress": "bg-blue-100 text-blue-700",
  review: "bg-yellow-100 text-yellow-700",
  todo: "bg-gray-100 text-gray-600",
  blocked: "bg-red-100 text-red-700",
};

interface ProjectDrawerProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDrawer({ project, onClose }: ProjectDrawerProps) {
  if (!project) return null;

  const doneTasks = project.tasks.filter((t) => t.status === "done").length;
  const openRisks = project.risks.filter((r) => r.status === "open").length;
  const nextMilestone = project.timeline.find((m) => m.status !== "completed");

  return (
    <Drawer
      open={!!project}
      onClose={onClose}
      title={project.name}
      subtitle={project.description}
      width="xl"
    >
      <div className="p-6 space-y-6">
        {/* Status bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={STATUS_STYLES[project.status]}>{project.status}</Badge>
          <span className="text-sm text-gray-500">{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 max-w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-700">{project.progress}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Tasks", value: project.tasks.length, icon: CheckCircle2, color: "text-blue-600 bg-blue-50" },
            { label: "Done", value: doneTasks, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
            { label: "Open Risks", value: openRisks, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
            { label: "Team", value: project.team.length, icon: Users, color: "text-purple-600 bg-purple-50" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-3 text-center">
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mx-auto mb-1`}>
                  <Icon size={15} />
                </div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Goals */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Target size={14} className="text-blue-600" /> Goals
          </h3>
          <ul className="space-y-1.5">
            {project.goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {g}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Tasks */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-600" /> Recent Tasks
            </h3>
            <div className="space-y-1.5">
              {project.tasks.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <Badge className={`text-xs shrink-0 ${TASK_STATUS_COLORS[t.status]}`}>{t.status}</Badge>
                  <span className="text-xs text-gray-700 truncate">{t.title}</span>
                </div>
              ))}
              {project.tasks.length === 0 && <p className="text-xs text-gray-400">No tasks yet</p>}
            </div>
          </div>

          {/* Risks */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" /> Risks
            </h3>
            <div className="space-y-1.5">
              {project.risks.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <Badge className={`text-xs shrink-0 ${getRiskColor(r.level)}`}>{r.level}</Badge>
                  <span className="text-xs text-gray-700 truncate">{r.title}</span>
                </div>
              ))}
              {project.risks.length === 0 && <p className="text-xs text-gray-400">No risks logged</p>}
            </div>
          </div>
        </div>

        {/* Next milestone */}
        {nextMilestone && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <Calendar size={16} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-800">Next Milestone</p>
              <p className="text-sm text-amber-700">{nextMilestone.title} — {formatDate(nextMilestone.dueDate)}</p>
            </div>
          </div>
        )}

        {/* Team */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Users size={14} className="text-purple-600" /> Team
          </h3>
          <div className="flex flex-wrap gap-2">
            {project.team.map((m) => (
              <div key={m.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {m.name.charAt(0)}
                </div>
                <span className="text-xs text-gray-700">{m.name}</span>
                <Badge className="text-xs bg-gray-100 text-gray-500">{m.role}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2 border-t border-gray-100">
          <Link href={`/projects/${project.id}`}>
            <Button className="w-full">
              Open Full Project <TrendingUp size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </Drawer>
  );
}
