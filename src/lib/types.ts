import type { Prisma } from "@prisma/client";
import type { leadInclude } from "@/lib/lead-query";

export type LeadWithRelations = Prisma.LeadGetPayload<{ include: typeof leadInclude }>;
