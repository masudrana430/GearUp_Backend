export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: "CUSTOMER" | "PROVIDER";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
}