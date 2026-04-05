import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getProject } from "@/lib/db";
import { ProjectDetail } from "@/components/projects/project-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={project.name} subtitle={project.description} />
        <ProjectDetail project={project} />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
