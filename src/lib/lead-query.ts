import type { Role } from "@prisma/client";

export function leadIncludeFor(viewerRole: Role) {
  return {
    freelancer: { select: { id: true, name: true, email: true } },
    qualifier: { select: { id: true, name: true, email: true } },
    salesManager: { select: { id: true, name: true, email: true } },
    requirementProfile: { select: { id: true, title: true } },
    comments: {
      where: viewerRole === "FREELANCER" ? { internal: false } : {},
      orderBy: { createdAt: "asc" as const },
      include: { author: { select: { id: true, name: true, role: true } } },
    },
  };
}
