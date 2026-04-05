import type { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRiskColor } from "@/lib/utils";
import { AlertTriangle, Shield, CheckCircle2 } from "lucide-react";

interface RisksTabProps {
  project: Project;
}

const PROB_COLORS: Record<string, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-red-600",
};

export function RisksTab({ project }: RisksTabProps) {
  const openRisks = project.risks.filter((r) => r.status === "open");
  const mitigatedRisks = project.risks.filter((r) => r.status === "mitigated");
  const closedRisks = project.risks.filter((r) => r.status === "closed");

  const criticalCount = project.risks.filter((r) => r.level === "critical").length;
  const highCount = project.risks.filter((r) => r.level === "high").length;

  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Risks",
            value: project.risks.length,
            icon: AlertTriangle,
            color: "text-gray-600 bg-gray-50",
          },
          {
            label: "Open",
            value: openRisks.length,
            icon: AlertTriangle,
            color: "text-red-600 bg-red-50",
          },
          {
            label: "Mitigated",
            value: mitigatedRisks.length,
            icon: Shield,
            color: "text-yellow-600 bg-yellow-50",
          },
          {
            label: "Closed",
            value: closedRisks.length,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-50",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 py-4">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {criticalCount > 0 || highCount > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Attention required
            </p>
            <p className="text-sm text-red-700 mt-0.5">
              {criticalCount > 0 && `${criticalCount} critical`}
              {criticalCount > 0 && highCount > 0 && " and "}
              {highCount > 0 && `${highCount} high`} risk
              {criticalCount + highCount > 1 ? "s" : ""} need immediate attention.
            </p>
          </div>
        </div>
      ) : null}

      {/* Risk list */}
      <div className="space-y-4">
        {project.risks.map((risk) => (
          <Card key={risk.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {risk.title}
                    </h3>
                    <Badge className={getRiskColor(risk.level)}>
                      {risk.level}
                    </Badge>
                    <Badge
                      className={
                        risk.status === "closed"
                          ? "bg-gray-100 text-gray-600"
                          : risk.status === "mitigated"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {risk.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{risk.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-gray-400 font-medium mb-1">Probability</p>
                  <p className={`font-semibold capitalize ${PROB_COLORS[risk.probability]}`}>
                    {risk.probability}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-1">Impact</p>
                  <p className={`font-semibold capitalize ${PROB_COLORS[risk.impact]}`}>
                    {risk.impact}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-1">Owner</p>
                  <p className="font-semibold text-gray-700">{risk.owner}</p>
                </div>
              </div>

              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs font-medium text-green-800 mb-1">
                  Mitigation
                </p>
                <p className="text-xs text-green-700">{risk.mitigation}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
