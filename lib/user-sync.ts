import { User } from "@supabase/supabase-js";

import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function syncAuthenticatedUser(user: User) {
  const supabase = createServiceRoleSupabaseClient();

  const { error: userError } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? `${user.id}@unknown.local`
    },
    { onConflict: "id" }
  );

  if (userError) {
    throw new Error(userError.message);
  }

  const { error: profileError } = await supabase.from("user_profile").upsert(
    {
      user_id: user.id,
      last_activity: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    throw new Error(profileError.message);
  }
}
