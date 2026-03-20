import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
        Sign out
      </Button>
    </form>
  );
}
