import { ProjectView } from "@azul/contracts";
import { Project, Role } from "@prisma/client";
export function projectView(project: Project, role: Role): ProjectView {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    version: project.version,
    role,
    demo: project.demo,
    expiresAt: project.expiresAt?.toISOString() ?? null,
  };
}
