export type TaskStatus = "todo" | "in-progress" | "review" | "done" | "blocked";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "member" | "viewer";
}

export interface Stakeholder {
  id: string;
  name: string;
  title?: string;
  role: string;
  email: string;
  influence: "high" | "medium" | "low";
  interest: "high" | "medium" | "low";
  impact?: "high" | "medium" | "low";
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  level: RiskLevel;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation: string;
  owner: string;
  status: "open" | "mitigated" | "closed";
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  jiraKey?: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: "upcoming" | "in-progress" | "completed" | "delayed";
}

export interface Dependency {
  id: string;
  title: string;
  type: "internal" | "external";
  status: "pending" | "resolved" | "blocked";
  description: string;
}

export interface WorkspaceDoc {
  id: string;
  type: "project-overview" | "stakeholder-map" | "risk-log" | "action-plan";
  title: string;
  content: string;
  lastUpdated: string;
}

export interface Iteration {
  id: string;
  number: number;
  title: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed";
  whatIsOff: string[];
  refinements: string[];
  improvements: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: "stakeholder" | "planning" | "risk" | "communication" | "review";
  prompt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "on-hold" | "completed";
  startDate: string;
  endDate: string;
  owner: string;
  projectLabel: string;
  team: User[];
  goals: string[];
  timeline: Milestone[];
  stakeholders: Stakeholder[];
  risks: Risk[];
  tasks: Task[];
  workspaceDocs: WorkspaceDoc[];
  dependencies: Dependency[];
  iterations: Iteration[];
  templates: WorkflowTemplate[];
  progress: number;
}
