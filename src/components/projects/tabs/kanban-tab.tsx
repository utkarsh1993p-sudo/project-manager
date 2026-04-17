"use client";

import type { Project, Task, TaskStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Plus, Calendar, Tag, AlertCircle } from "lucide-react";

function getDaysUntilDue(dueDate: string): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "bg-gray-100" },
  { id: "in-progress", label: "In Progress", color: "bg-blue-50" },
  { id: "review", label: "Review", color: "bg-yellow-50" },
  { id: "done", label: "Done", color: "bg-green-50" },
  { id: "blocked", label: "Blocked", color: "bg-red-50" },
];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-400",
  medium: "border-l-yellow-400",
  low: "border-l-gray-300",
};

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const daysUntilDue = task.dueDate ? getDaysUntilDue(task.dueDate) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 14;
  const isUrgentDue = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3;

  const urgencyBorder = isOverdue
    ? "border-l-red-600"
    : isUrgentDue
    ? "border-l-orange-500"
    : isDueSoon
    ? "border-l-amber-400"
    : PRIORITY_COLORS[task.priority];

  const urgencyBg = isOverdue
    ? "bg-red-50"
    : isUrgentDue
    ? "bg-orange-50"
    : isDueSoon
    ? "bg-amber-50/40"
    : "bg-white";

  return (
    <div
      className={`${urgencyBg} rounded-lg border border-gray-200 p-3 shadow-sm border-l-4 ${urgencyBorder} cursor-pointer hover:shadow-md transition-shadow`}
    >
      {/* Due-soon alert strip */}
      {(isOverdue || isDueSoon) && task.status !== "done" && (
        <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${isOverdue ? "text-red-600" : isUrgentDue ? "text-orange-600" : "text-amber-600"}`}>
          <AlertCircle size={11} />
          {isOverdue
            ? `Overdue by ${Math.abs(daysUntilDue!)} day${Math.abs(daysUntilDue!) !== 1 ? "s" : ""}`
            : daysUntilDue === 0
            ? "Due today"
            : `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`}
          {task.jiraKey && <span className="ml-auto font-mono text-[10px] opacity-70">{task.jiraKey}</span>}
        </div>
      )}

      <p className="text-sm font-medium text-gray-900 mb-2">{task.title}</p>

      {!isOverdue && !isDueSoon && task.jiraKey && (
        <p className="text-[10px] font-mono text-gray-400 mb-1">{task.jiraKey}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        {task.tags?.filter(t => t !== "jira").map((tag) => (
          <span
            key={tag}
            className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1"
          >
            <Tag size={9} />
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2">
        <Badge className={`text-xs ${getStatusColor(task.priority)} ${
          task.priority === "urgent" ? "bg-red-100 text-red-700" :
          task.priority === "high" ? "bg-orange-100 text-orange-700" :
          task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
          "bg-gray-100 text-gray-600"
        }`}>
          {task.priority}
        </Badge>

        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500 font-semibold" : isDueSoon ? "text-amber-600 font-medium" : "text-gray-400"}`}>
              <Calendar size={10} />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.assignee && (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {task.assignee.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface KanbanTabProps {
  project: Project;
}

export function KanbanTab({ project }: KanbanTabProps) {
  const tasksByStatus = (status: TaskStatus) =>
    project.tasks.filter((t) => t.status === status);

  return (
    <div className="p-3 md:p-6">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const tasks = tasksByStatus(col.id);
          return (
            <div key={col.id} className="flex-1 min-w-56 max-w-72 shrink-0">
              <div
                className={`rounded-xl ${col.color} border border-gray-200 p-3`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                      {col.label}
                    </h3>
                    <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-xs flex items-center justify-center text-gray-600 font-medium">
                      {tasks.length}
                    </span>
                  </div>
                  <button className="w-6 h-6 rounded-md hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
