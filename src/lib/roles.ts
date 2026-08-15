import { Role } from "@prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  FREELANCER: "/freelancer",
  QUALIFIER: "/qualify",
  SALES_MANAGER: "/sales",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  FREELANCER: "Freelancer",
  QUALIFIER: "Qualifier",
  SALES_MANAGER: "Sales Manager",
};
