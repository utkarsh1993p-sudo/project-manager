"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectDrawer } from "./create-project-drawer";

interface NewProjectButtonProps {
  jiraConnected: boolean;
  jiraProjectKey?: string;
  confluenceConnected: boolean;
  confluenceSpaceKey?: string;
}

export function NewProjectButton({
  jiraConnected,
  jiraProjectKey,
  confluenceConnected,
  confluenceSpaceKey,
}: NewProjectButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" className="shrink-0 self-start sm:self-auto" onClick={() => setOpen(true)}>
        <Plus size={16} />
        New Project
      </Button>
      <CreateProjectDrawer
        open={open}
        onClose={() => setOpen(false)}
        jiraConnected={jiraConnected}
        jiraProjectKey={jiraProjectKey}
        confluenceConnected={confluenceConnected}
        confluenceSpaceKey={confluenceSpaceKey}
      />
    </>
  );
}
