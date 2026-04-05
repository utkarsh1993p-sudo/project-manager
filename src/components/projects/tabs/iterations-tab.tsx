import type { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AlertCircle, CheckCircle2, ArrowRight, Lightbulb } from "lucide-react";

interface IterationsTabProps {
  project: Project;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  active: "bg-blue-100 text-blue-700",
  planning: "bg-gray-100 text-gray-600",
};

export function IterationsTab({ project }: IterationsTabProps) {
  if (project.iterations.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No iterations yet. Start your first iteration to track corrections and improvements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Lightbulb size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          <strong>Iterate, don&apos;t restart.</strong> Each iteration identifies what&apos;s off, refines outputs, and improves direction — building momentum rather than throwing away work.
        </p>
      </div>

      {project.iterations.map((iter) => (
        <Card key={iter.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                  {iter.number}
                </div>
                <div>
                  <CardTitle>{iter.title}</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(iter.startDate)} → {formatDate(iter.endDate)}
                  </p>
                </div>
              </div>
              <Badge className={STATUS_COLORS[iter.status]}>{iter.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {/* What's Off */}
              <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-red-500" />
                  <p className="text-xs font-semibold text-red-800">
                    What&apos;s Off
                  </p>
                </div>
                {iter.whatIsOff.length > 0 ? (
                  <ul className="space-y-1.5">
                    {iter.whatIsOff.map((item, i) => (
                      <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-red-500 italic">TBD</p>
                )}
              </div>

              {/* Refinements */}
              <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight size={14} className="text-yellow-600" />
                  <p className="text-xs font-semibold text-yellow-800">
                    Refinements
                  </p>
                </div>
                {iter.refinements.length > 0 ? (
                  <ul className="space-y-1.5">
                    {iter.refinements.map((item, i) => (
                      <li key={i} className="text-xs text-yellow-700 flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full bg-yellow-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-yellow-600 italic">TBD</p>
                )}
              </div>

              {/* Improvements */}
              <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <p className="text-xs font-semibold text-green-800">
                    Improvements
                  </p>
                </div>
                {iter.improvements.length > 0 ? (
                  <ul className="space-y-1.5">
                    {iter.improvements.map((item, i) => (
                      <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full bg-green-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-green-600 italic">TBD</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
