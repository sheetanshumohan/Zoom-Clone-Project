import { redirect } from "next/navigation";

export default function RootPage() {
  // Automatically redirect the user to the main dashboard
  redirect("/dashboard");
}
