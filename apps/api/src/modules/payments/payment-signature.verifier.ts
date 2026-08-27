import { createHash } from "crypto";

export class PaymentSignatureVerifier {
  /**
   * Verifies Midtrans / Standard Indonesian Payment Gateway SHA-512 Webhook Signature.
   * Signature Formula: SHA512(order_id + status_code + gross_amount + server_key)
   */
  static verifyMidtransSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string,
    serverKey: string
  ): boolean {
    if (!orderId || !statusCode || !grossAmount || !signatureKey || !serverKey) {
      return false;
    }

    const payloadStr = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const expectedHash = createHash("sha512").update(payloadStr).digest("hex");

    return expectedHash.toLowerCase() === signatureKey.toLowerCase();
  }
}
