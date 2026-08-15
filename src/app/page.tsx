import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/roles";

export default async function Home() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(ROLE_HOME[session.user.role]);
}
