export interface CreateReviewInput {
  rentalOrderId: string;
  gearItemId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export interface ReviewQueryInput {
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
}