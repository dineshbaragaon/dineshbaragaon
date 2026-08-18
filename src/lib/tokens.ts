import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const TOKEN_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;
