import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PAYMENT_PROVIDER } from "./payment-provider.interface";
import { MockPaymentProvider } from "./providers/mock-payment.provider";
import { CmiPaymentProvider } from "./providers/cmi-payment.provider";

@Module({
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get("PAYMENT_PROVIDER", "mock");
        return provider === "cmi" ? new CmiPaymentProvider() : new MockPaymentProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentProviderModule {}
