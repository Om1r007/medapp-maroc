import type { PaymentProvider } from "../payment-provider.interface";

export class MockPaymentProvider implements PaymentProvider {
  private readonly store = new Map<string, "PENDING" | "SUCCEEDED" | "FAILED">();

  async initiate(consultationId: string, _amount: number) {
    const paymentRef = `MOCK-${consultationId}-${Date.now()}`;
    this.store.set(paymentRef, "PENDING");
    return { paymentRef };
  }

  async verify(paymentRef: string) {
    return { status: this.store.get(paymentRef) ?? ("PENDING" as const) };
  }

  async refund(paymentRef: string) {
    this.store.set(paymentRef, "FAILED");
    console.log(`[MockPayment] refund simulated for ${paymentRef}`);
    return { status: "REFUNDED" as const };
  }
}
