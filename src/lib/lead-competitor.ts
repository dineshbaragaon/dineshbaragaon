import type { Competitor, EngagementType } from "@prisma/client";

export const COMPETITOR_LABEL: Record<Competitor, string> = {
  AIRWALLEX: "Airwallex",
  PAYONEER: "Payoneer",
  WISE: "Wise",
  WORLDFIRST: "WorldFirst",
  OTHER: "Other",
};

export const COMPETITOR_COLOR: Record<Competitor, string> = {
  AIRWALLEX: "bg-purple-100 text-purple-800",
  PAYONEER: "bg-sky-100 text-sky-800",
  WISE: "bg-emerald-100 text-emerald-800",
  WORLDFIRST: "bg-orange-100 text-orange-800",
  OTHER: "bg-slate-100 text-slate-700",
};

export const ENGAGEMENT_LABEL: Record<EngagementType, string> = {
  LIKED: "Liked the post",
  COMMENTED: "Commented on the post",
  SHARED: "Shared the post",
  FOLLOWED: "Follows the page",
  OTHER: "Other engagement",
};
