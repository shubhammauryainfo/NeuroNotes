import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";
import { syncAuthenticatedUser } from "@/lib/user-sync";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      await syncAuthenticatedUser(data.user);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
