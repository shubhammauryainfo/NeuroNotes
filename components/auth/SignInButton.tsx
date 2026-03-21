import { signInWithGoogle } from "@/lib/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function SignInButton() {
  return (
    <form action={signInWithGoogle}>
      <SubmitButton
        idleLabel="Sign in with Google"
        pendingLabel="Redirecting..."
      />
    </form>
  );
}
