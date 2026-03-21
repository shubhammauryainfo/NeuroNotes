import { signOut } from "@/lib/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <SubmitButton
        variant="secondary"
        className="px-3 py-2 text-xs"
        idleLabel="Sign out"
        pendingLabel="Signing out..."
      />
    </form>
  );
}
