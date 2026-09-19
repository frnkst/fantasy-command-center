"use server";

import { redirect } from "next/navigation";

import { clearSession, createSession } from "@/lib/auth";
import { passwordMatches } from "@/lib/auth-crypto";
import { getAppConfig } from "@/lib/config";

export async function signIn(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password, getAppConfig().dashboardPassword)) {
    redirect("/login?error=Incorrect%20password");
  }

  await createSession();
  redirect("/");
}

export async function signOut() {
  await clearSession();
  redirect("/login");
}
