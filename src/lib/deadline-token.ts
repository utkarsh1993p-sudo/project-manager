import { createHmac } from "crypto";

const SECRET = process.env.DEADLINE_TOKEN_SECRET ?? "changeme";
const EXPIRY_DAYS = 30;

export interface DeadlineTokenPayload {
  taskId: string;
  projectId: string;
  taskTitle: string;
  taskDueDate: string;
  stakeholderEmail: string;
  stakeholderName: string;
  action?: string;
  exp: number;
}

function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = 4 - (padded.length % 4);
  const padded2 = padding < 4 ? padded + "=".repeat(padding) : padded;
  return Buffer.from(padded2, "base64").toString("utf-8");
}

function computeSignature(encodedPayload: string): string {
  return createHmac("sha256", SECRET).update(encodedPayload).digest("hex");
}

export function signToken(payload: Omit<DeadlineTokenPayload, "exp"> & Partial<Pick<DeadlineTokenPayload, "exp">>): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: DeadlineTokenPayload = {
    ...payload,
    exp: payload.exp ?? now + EXPIRY_DAYS * 24 * 60 * 60,
  };
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const signature = computeSignature(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): DeadlineTokenPayload | null {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const encodedPayload = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);

    const expectedSignature = computeSignature(encodedPayload);
    if (signature !== expectedSignature) return null;

    const rawPayload = base64urlDecode(encodedPayload);
    const payload = JSON.parse(rawPayload) as DeadlineTokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}
