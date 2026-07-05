import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import type { UserRole } from "../modules/auth/auth.interface.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const auth = (
  ...requiredRoles: UserRole[]
): RequestHandler => {
  return catchAsync(async (req, _res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      throw new ApiError(401, "Authentication required", [
        {
          message: "Provide a Bearer token in the Authorization header",
        },
      ]);
    }

    const token = authorizationHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Authentication required", [
        {
          message: "Access token is missing",
        },
      ]);
    }

    let decodedUser;

    try {
      decodedUser = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, "Invalid or expired token", [
        {
          message: "Please log in again",
        },
      ]);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decodedUser.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    if (user.status === "SUSPENDED") {
      throw new ApiError(403, "Account suspended", [
        {
          message: "Your account has been suspended",
        },
      ]);
    }

    if (
      requiredRoles.length > 0 &&
      !requiredRoles.includes(user.role as UserRole)
    ) {
      throw new ApiError(403, "Access forbidden", [
        {
          message: "You do not have permission to access this resource",
        },
      ]);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    next();
  });
};