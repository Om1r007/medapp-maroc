import { NotImplementedException } from "@nestjs/common";
import type { PaymentProvider } from "../payment-provider.interface";

export class CmiPaymentProvider implements PaymentProvider {
  async initiate(_consultationId: string, _amount: number): Promise<never> {
    throw new NotImplementedException("CMI provider non implémenté");
  }

  async verify(_paymentRef: string): Promise<never> {
    throw new NotImplementedException("CMI provider non implémenté");
  }

  async refund(_paymentRef: string): Promise<never> {
    throw new NotImplementedException("CMI provider non implémenté");
  }
}
