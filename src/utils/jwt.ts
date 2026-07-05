import jwt, {
  type JwtPayload,
  type SignOptions,
} from "jsonwebtoken";
import { env } from "../config/env.js";
import type {
  JwtUser,
  UserRole,
} from "../modules/auth/auth.interface.js";

const validRoles: UserRole[] = [
  "CUSTOMER",
  "PROVIDER",
  "ADMIN",
];

const isValidRole = (value: unknown): value is UserRole => {
  return (
    typeof value === "string" &&
    validRoles.includes(value as UserRole)
  );
};

export const signAccessToken = (payload: JwtUser): string => {
  const options: SignOptions = {
    subject: payload.id,
    expiresIn:
      env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      email: payload.email,
      role: payload.role,
    },
    env.JWT_ACCESS_SECRET,
    options,
  );
};

export const verifyAccessToken = (token: string): JwtUser => {
  const decoded = jwt.verify(
    token,
    env.JWT_ACCESS_SECRET,
  ) as JwtPayload;

  if (
    typeof decoded.sub !== "string" ||
    typeof decoded.email !== "string" ||
    !isValidRole(decoded.role)
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
  };
};