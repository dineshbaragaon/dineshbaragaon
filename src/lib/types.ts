import type { Prisma } from "@prisma/client";
import type { leadIncludeFor } from "@/lib/lead-query";

export type LeadWithRelations = Prisma.LeadGetPayload<{ include: ReturnType<typeof leadIncludeFor> }>;
