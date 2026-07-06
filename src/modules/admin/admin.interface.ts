export interface AdminUserQuery {
  search?: string;
  role?: "CUSTOMER" | "PROVIDER" | "ADMIN";
  status?: "ACTIVE" | "SUSPENDED";
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
}

export interface AdminGearQuery {
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
}

export interface AdminRentalQuery {
  status?:
    | "PLACED"
    | "CONFIRMED"
    | "PAID"
    | "PICKED_UP"
    | "RETURNED"
    | "CANCELLED";
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
}

export interface AdminPaymentQuery {
  status?:
    | "PENDING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
}