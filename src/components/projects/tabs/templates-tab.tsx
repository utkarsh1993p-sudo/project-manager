import type { Project } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Users, FileText, AlertTriangle, MessageSquare, Settings, Search } from "lucide-react";

const CATEGORY_META: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  stakeholder: {
    label: "Stakeholder",
    color: "bg-blue-100 text-blue-700",
    icon: Users,
  },
  planning: {
    label: "Planning",
    color: "bg-purple-100 text-purple-700",
    icon: FileText,
  },
  risk: {
    label: "Risk",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
  communication: {
    label: "Communication",
    color: "bg-green-100 text-green-700",
    icon: MessageSquare,
  },
  review: {
    label: "Review",
    color: "bg-orange-100 text-orange-700",
    icon: Search,
  },
};

interface TemplatesTabProps {
  project: Project;
}

export function TemplatesTab({ project }: TemplatesTabProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Settings size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Standardize Your Workflow
            </p>
            <p className="text-sm text-blue-700 mt-0.5">
              Reuse prompts, build templates, and automate recurring work.
              Efficiency compounds over time.
            </p>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-900 text-white">
          All
        </button>
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <button
            key={key}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {project.templates.map((template) => {
          const meta = CATEGORY_META[template.category];
          const Icon = meta.icon;
          return (
            <Card key={template.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        template.category === "stakeholder"
                          ? "bg-blue-50"
                          : template.category === "planning"
                          ? "bg-purple-50"
                          : template.category === "risk"
                          ? "bg-red-50"
                          : template.category === "communication"
                          ? "bg-green-50"
                          : "bg-orange-50"
                      }`}
                    >
                      <Icon size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        <Badge className={meta.color}>{meta.label}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        {template.description}
                      </p>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-400 mb-1">
                          Prompt template:
                        </p>
                        <p className="text-xs text-gray-700 font-mono leading-relaxed">
                          {template.prompt}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="secondary" size="sm">
                      <Copy size={12} />
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
