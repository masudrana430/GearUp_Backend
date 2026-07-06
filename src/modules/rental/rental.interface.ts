export interface RentalItemInput {
  gearItemId: string;
  quantity: number;
}

export interface CreateRentalInput {
  startDate: string;
  endDate: string;
  notes?: string;
  items: RentalItemInput[];
}

export interface RentalQueryInput {
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

export interface UpdateRentalStatusInput {
  status: "CONFIRMED" | "PICKED_UP" | "RETURNED";
}