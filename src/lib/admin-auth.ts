import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "komik_admin_session";
const SESSION_AGE_SECONDS = 60 * 60 * 12;

type AdminSessionPayload = {
  email: string;
  exp: number;
};

function getAdminConfig() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!email || !password || !secret) {
    throw new Error("Admin env belum lengkap.");
  }

  return { email, password, secret };
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyAdminCredentials(email: string, password: string) {
  const config = getAdminConfig();

  return (
    safeCompare(email.trim().toLowerCase(), config.email.toLowerCase()) &&
    safeCompare(password, config.password)
  );
}

export function createAdminSession(email: string) {
  const { secret } = getAdminConfig();
  const payload = base64Url(
    JSON.stringify({
      email,
      exp: Math.floor(Date.now() / 1000) + SESSION_AGE_SECONDS,
    } satisfies AdminSessionPayload),
  );

  return `${payload}.${sign(payload, secret)}`;
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, createAdminSession(email), {
    httpOnly: true,
    maxAge: SESSION_AGE_SECONDS,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const { secret } = getAdminConfig();
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  if (!safeCompare(signature, sign(payload, secret))) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AdminSessionPayload;

    if (!decoded.email || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
