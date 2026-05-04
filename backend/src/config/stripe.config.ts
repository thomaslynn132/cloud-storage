export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  basicPriceId: process.env.STRIPE_BASIC_PRICE_ID,
  proPriceId: process.env.STRIPE_PRO_HICE_ID,
};
