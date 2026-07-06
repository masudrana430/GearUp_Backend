export type PaymentStatusValue =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface PaymentQueryInput {
  status?: PaymentStatusValue;
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
}

export interface SSLCallbackPayload {
  tran_id: string;
  val_id?: string;
  status?: string;
  amount?: string;
  currency?: string;
  currency_type?: string;
  card_type?: string;
  bank_tran_id?: string;
  risk_level?: string | number;
  risk_title?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
  [key: string]: unknown;
}

export interface SSLSessionResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  redirectGatewayURL?: string;
  [key: string]: unknown;
}

export interface SSLValidationResponse {
  status: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  store_amount?: string;
  currency?: string;
  currency_type?: string;
  bank_tran_id?: string;
  card_type?: string;
  risk_level?: string | number;
  risk_title?: string;
  tran_date?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
  [key: string]: unknown;
}