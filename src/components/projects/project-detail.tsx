"use client";

import { useState } from "react";
import type { Project } from "@/types";
import { ContextTab } from "./tabs/context-tab";
import { WorkspaceTab } from "./tabs/workspace-tab";
import { PlanningTab } from "./tabs/planning-tab";
import { AlignmentTab } from "./tabs/alignment-tab";
import { RisksTab } from "./tabs/risks-tab";
import { KanbanTab } from "./tabs/kanban-tab";
import { IterationsTab } from "./tabs/iterations-tab";
import { TeamTab } from "./tabs/team-tab";
import { TemplatesTab } from "./tabs/templates-tab";
import { JiraPanel } from "@/components/integrations/jira-panel";
import { ConfluencePanel } from "@/components/integrations/confluence-panel";
import { AIAssistant } from "@/components/ai/ai-assistant";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Clock, Users, TrendingUp } from "lucide-react";

const TABS = [
  { id: "context", label: "Context" },
  { id: "workspace", label: "Workspace" },
  { id: "planning", label: "Planning" },
  { id: "alignment", label: "Alignment" },
  { id: "risks", label: "Risks" },
  { id: "kanban", label: "Kanban" },
  { id: "iterations", label: "Iterations" },
  { id: "team", label: "Team" },
  { id: "templates", label: "Templates" },
  { id: "jira", label: "JIRA" },
  { id: "confluence", label: "Confluence" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  planning: "bg-blue-100 text-blue-700",
  "on-hold": "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
};

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState("context");

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Project summary bar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 md:gap-6">
        <Badge className={STATUS_STYLES[project.status]}>{project.status}</Badge>
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <TrendingUp size={14} />
          {project.progress}% complete
        </span>
        <span className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
          <Clock size={14} />
          {formatDate(project.startDate)} → {formatDate(project.endDate)}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <Users size={14} />
          {project.team.length} members
        </span>
        <div className="hidden sm:block flex-1 max-w-xs">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-2 md:px-6">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 md:px-4 py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              } ${
                tab.id === "jira"
                  ? "text-blue-700"
                  : tab.id === "confluence"
                  ? "text-blue-500"
                  : ""
              }`}
            >
              {tab.id === "jira" && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-600 rounded-sm text-white text-[8px] font-bold flex items-center justify-center">J</span>
                  {tab.label}
                </span>
              )}
              {tab.id === "confluence" && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded-sm text-white text-[8px] font-bold flex items-center justify-center">C</span>
                  {tab.label}
                </span>
              )}
              {tab.id !== "jira" && tab.id !== "confluence" && tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Assistant floating button */}
      <AIAssistant project={project} />

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeTab === "context" && <ContextTab project={project} />}
        {activeTab === "workspace" && <WorkspaceTab project={project} />}
        {activeTab === "planning" && <PlanningTab project={project} />}
        {activeTab === "alignment" && <AlignmentTab project={project} />}
        {activeTab === "risks" && <RisksTab project={project} />}
        {activeTab === "kanban" && <KanbanTab project={project} />}
        {activeTab === "iterations" && <IterationsTab project={project} />}
        {activeTab === "team" && <TeamTab project={project} />}
        {activeTab === "templates" && <TemplatesTab project={project} />}
        {activeTab === "jira" && (
          <div className="p-6">
            <JiraPanel projectId={project.id} tasks={project.tasks} />
          </div>
        )}
        {activeTab === "confluence" && (
          <div className="p-6">
            <ConfluencePanel docs={project.workspaceDocs} />
          </div>
        )}
      </div>
    </div>
  );
}
