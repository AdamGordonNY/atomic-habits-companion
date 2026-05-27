import { redirect } from "next/navigation";

// Clerk handles sign-in through <SignUpButton mode="modal"> or its hosted UI.
// Redirect any old /auth/sign-in links back to the homepage.
export default function SignInPage() {
  redirect("/");
}
