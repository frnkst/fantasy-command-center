import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  passwordMatches,
  validSessionToken,
} from "@/lib/auth-crypto";

describe("password authentication", () => {
  it("compares passwords without leaking length differences", () => {
    expect(passwordMatches("correct horse", "correct horse")).toBe(true);
    expect(passwordMatches("wrong", "correct horse")).toBe(false);
  });

  it("signs sessions with the configured password", () => {
    const token = createSessionToken("a-strong-master-password");

    expect(validSessionToken(token, "a-strong-master-password")).toBe(true);
    expect(validSessionToken(token, "a-different-master-password")).toBe(false);
  });
});
