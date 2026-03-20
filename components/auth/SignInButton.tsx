import { signInWithGoogle } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export function SignInButton() {
  return (
    <form action={signInWithGoogle}>
      <Button type="submit">Sign in with Google</Button>
    </form>
  );
}
