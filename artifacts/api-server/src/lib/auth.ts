import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { db, utentiTable, type Utente } from "@workspace/db";
import { eq } from "drizzle-orm";

export type StaffRole = "admin" | "manager" | "staff";

export type AuthenticatedUser = Pick<Utente, "id" | "nome" | "ruolo" | "email" | "stato"> & {
  ruolo: StaffRole;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

const TOKEN_VERSION = "zak-auth-v1";
const PASSWORD_VERSION = "scrypt-v1";
const DEFAULT_SESSION_HOURS = 12;
const REMEMBER_SESSION_DAYS = 7;

const roleRank: Record<StaffRole, number> = {
  staff: 1,
  manager: 2,
  admin: 3,
};

const getAuthSecret = () => {
  const secret = process.env["ZAK_AUTH_SECRET"] || process.env["SESSION_SECRET"];
  if (secret) return secret;

  if (process.env["NODE_ENV"] === "production") {
    throw new Error("ZAK_AUTH_SECRET is required in production");
  }

  return "zak-dev-auth-secret-change-before-production";
};

const toBase64Url = (value: Buffer | string) => Buffer.from(value).toString("base64url");
const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const sign = (payload: string) =>
  crypto.createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");

const sanitizeUser = (user: Utente): AuthenticatedUser => ({
  id: user.id,
  nome: user.nome,
  ruolo: user.ruolo as StaffRole,
  email: user.email,
  stato: user.stato,
});

export const hashPassword = async (password: string) => {
  const salt = crypto.randomBytes(16).toString("base64url");
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
  return `${PASSWORD_VERSION}:${salt}:${key.toString("base64url")}`;
};

export const verifyPassword = async (password: string, passwordHash: string | null) => {
  if (!passwordHash) return false;
  const [version, salt, storedKey] = passwordHash.split(":");
  if (version !== PASSWORD_VERSION || !salt || !storedKey) return false;

  const candidate = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });

  const stored = Buffer.from(storedKey, "base64url");
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
};

export const createAuthToken = (user: AuthenticatedUser, remember = false) => {
  const expiresAt = new Date(
    Date.now() + (remember ? REMEMBER_SESSION_DAYS * 24 : DEFAULT_SESSION_HOURS) * 60 * 60 * 1000,
  );
  const payload = toBase64Url(JSON.stringify({
    version: TOKEN_VERSION,
    sub: user.id,
    ruolo: user.ruolo,
    exp: expiresAt.toISOString(),
  }));
  return {
    token: `${payload}.${sign(payload)}`,
    expiresAt,
  };
};

export const verifyAuthToken = (token: string) => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || signature !== sign(payload)) return null;

  const parsed = JSON.parse(fromBase64Url(payload)) as {
    version?: string;
    sub?: string;
    ruolo?: StaffRole;
    exp?: string;
  };

  if (parsed.version !== TOKEN_VERSION || !parsed.sub || !parsed.exp) return null;
  if (new Date(parsed.exp).getTime() <= Date.now()) return null;
  return parsed;
};

export const getBearerToken = (req: Request) => {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim() || null;
  }

  const queryToken = req.query["token"];
  return typeof queryToken === "string" && queryToken.trim() ? queryToken.trim() : null;
};

export const loadAuthenticatedUser = async (req: Request) => {
  const token = getBearerToken(req);
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload) return null;
  const userId = payload.sub;
  if (!userId) return null;

  const [user] = await db.select().from(utentiTable).where(eq(utentiTable.id, userId));
  if (!user || user.stato !== "attivo") return null;
  return sanitizeUser(user);
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await loadAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    req.authUser = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid session" });
  }
};

export const requireRole = (minimumRole: StaffRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.authUser;
    if (!user || roleRank[user.ruolo] < roleRank[minimumRole]) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
};

export const toAuthUser = sanitizeUser;

export const toPublicUser = (user: Utente) => {
  const { password_hash: _passwordHash, ...publicUser } = user;
  return publicUser;
};
