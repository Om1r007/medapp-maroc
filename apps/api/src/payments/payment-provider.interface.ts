export const PAYMENT_PROVIDER = "PAYMENT_PROVIDER";

export interface PaymentProvider {
  initiate(
    consultationId: string,
    amount: number,
  ): Promise<{ paymentRef: string; redirectUrl?: string }>;
  verify(paymentRef: string): Promise<{ status: "SUCCEEDED" | "FAILED" | "PENDING" }>;
  refund(paymentRef: string): Promise<{ status: "REFUNDED" }>;
}
