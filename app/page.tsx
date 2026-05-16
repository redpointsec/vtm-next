import { redirect } from "next/navigation";
import { getCurrentTrainingUser } from "@/lib/auth";

export default async function HomePage() {
  const currentUser = await getCurrentTrainingUser();

  redirect(currentUser ? "/dashboard" : "/login");
}
