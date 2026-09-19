import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SESSION_MESSAGE = "fantasy-desk:authenticated:v1";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function createSessionToken(password: string) {
  return createHmac("sha256", password).update(SESSION_MESSAGE).digest("base64url");
}

export function passwordMatches(candidate: string, expected: string) {
  return timingSafeEqual(digest(candidate), digest(expected));
}

export function validSessionToken(token: string, password: string) {
  return timingSafeEqual(digest(token), digest(createSessionToken(password)));
}
