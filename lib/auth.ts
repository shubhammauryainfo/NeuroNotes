import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase";

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function signInWithGoogle() {
  "use server";

  const supabase = await createServerSupabaseClient();
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback`
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    redirect(data.url as never);
  }
}

export async function signOut() {
  "use server";

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
