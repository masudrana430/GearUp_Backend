import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { signAccessToken } from "../../utils/jwt.js";
import type {
  LoginInput,
  RegisterInput,
  UserRole,
} from "./auth.interface.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  profileImage: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (existingUser) {
    throw new ApiError(409, "Email already registered", [
      {
        field: "email",
        message: "An account already exists with this email",
      },
    ]);
  }

  const passwordHash = await bcrypt.hash(
    input.password,
    env.BCRYPT_SALT_ROUNDS,
  );

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
      address: input.address,
      role: input.role,
    },
    select: safeUserSelect,
  });

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
  });

  return {
    user,
    accessToken,
  };
};

const loginUser = async (input: LoginInput) => {
  console.log("Login request email:", input.email);

  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  console.log("Database user found:", user?.email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password", [
      {
        message: "The supplied login credentials are incorrect",
      },
    ]);
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password", [
      {
        message: "The supplied login credentials are incorrect",
      },
    ]);
  }

  if (user.status === "SUSPENDED") {
    throw new ApiError(403, "Account suspended", [
      {
        message: "Your account has been suspended by an administrator",
      },
    ]);
  }

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
  });

  const { passwordHash: _passwordHash, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken,
  };
};

const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: safeUserSelect,
  });

  if (!user) {
    throw new ApiError(404, "User not found", [
      {
        message: "The authenticated user no longer exists",
      },
    ]);
  }

  return user;
};

export const authService = {
  registerUser,
  loginUser,
  getCurrentUser,
};
