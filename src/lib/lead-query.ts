export const leadInclude = {
  freelancer: { select: { id: true, name: true, email: true } },
  qualifier: { select: { id: true, name: true, email: true } },
  salesManager: { select: { id: true, name: true, email: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { id: true, name: true, role: true } } },
  },
};
