/**
 * Payment provider abstraction.
 *
 * Checkout talks only to this interface, so adding Stripe (or Klarna, Vipps,
 * PayPal, ...) is a matter of implementing PaymentProvider and switching the
 * export at the bottom — no storefront changes required.
 *
 * Stripe sketch:
 *   class StripeProvider implements PaymentProvider {
 *     async createPayment(input) {
 *       const intent = await stripe.paymentIntents.create({
 *         amount: Math.round(input.amountTotal * 100),
 *         currency: input.currency.toLowerCase(),
 *         receipt_email: input.customer.email,
 *         metadata: { storeId: input.storeId, orderRef: input.orderRef },
 *       });
 *       return { status: "REQUIRES_ACTION", clientSecret: intent.client_secret, ... };
 *     }
 *   }
 */

export interface PaymentCustomer {
  name: string;
  email: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PaymentLineItem {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePaymentInput {
  storeId: string;
  orderRef: string;
  currency: string;
  amountSubtotal: number;
  amountShipping: number;
  amountTotal: number;
  customer: PaymentCustomer;
  lineItems: PaymentLineItem[];
}

export type PaymentStatus = "SUCCEEDED" | "REQUIRES_ACTION" | "FAILED";

export interface PaymentResult {
  status: PaymentStatus;
  providerName: string;
  /** Provider transaction id (mock generates a fake one). */
  transactionId: string;
  /** For redirect/confirm flows (e.g. Stripe client secret). */
  clientSecret?: string;
  errorMessage?: string;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
}

/** Simulates an always-successful payment. Active while MOCK_CHECKOUT=true. */
class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (input.amountTotal <= 0) {
      return {
        status: "FAILED",
        providerName: this.name,
        transactionId: "",
        errorMessage: "Order total must be greater than zero.",
      };
    }
    return {
      status: "SUCCEEDED",
      providerName: this.name,
      transactionId: `mock_${input.orderRef}_${Date.now().toString(36)}`,
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.MOCK_CHECKOUT !== "false") {
    return new MockPaymentProvider();
  }
  return new MockPaymentProvider();
}
