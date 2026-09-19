import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSessionToken,
  validSessionToken,
} from "@/lib/auth-crypto";
import { getAppConfig } from "@/lib/config";

const COOKIE_NAME = "fcc-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export async function isAuthenticated() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token
    ? validSessionToken(token, getAppConfig().dashboardPassword)
    : false;
}

export async function createSession() {
  const config = getAppConfig();
  (await cookies()).set(
    COOKIE_NAME,
    createSessionToken(config.dashboardPassword),
    {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    },
  );
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function requireOwner() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
}
