export interface PlanUrls {
  monthly: string;
  yearly: string;
}

/**
 * Polar Subscription Checkout URLs
 * Swap these placeholders with your actual Polar checkout links!
 * You can get these links directly from your Polar Dashboard > Products.
 */
export const POLAR_CHECKOUT_URLS: Record<string, PlanUrls> = {
  STARTER: {
    monthly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_wZtKIjLTbusvmxu9pBe4unr0zb1O6o77m9k6H0N4DqY/redirect?product_id=79bf0142-55f1-4d58-a4d5-7653a19c7f06",
    yearly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_wZtKIjLTbusvmxu9pBe4unr0zb1O6o77m9k6H0N4DqY/redirect?product_id=79bf0142-55f1-4d58-a4d5-7653a19c7f06",
  },         
  PRO: {
    monthly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_wZtKIjLTbusvmxu9pBe4unr0zb1O6o77m9k6H0N4DqY/redirect?product_id=ad8facd2-169b-45ed-b844-3cd2ee7d2470",
    yearly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_wZtKIjLTbusvmxu9pBe4unr0zb1O6o77m9k6H0N4DqY/redirect?product_id=ad8facd2-169b-45ed-b844-3cd2ee7d2470",
  },
  ULTRA: {
    monthly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_wZtKIjLTbusvmxu9pBe4unr0zb1O6o77m9k6H0N4DqY/redirect?product_id=7e54e2f0-0df7-4d80-9781-2c7cc29f7d9a",
    yearly: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_wZtKIjLTbusvmxu9pBe4unr0zb1O6o77m9k6H0N4DqY/redirect?product_id=7e54e2f0-0df7-4d80-9781-2c7cc29f7d9a",
  },
};

/**
 * Gets the configured Polar Checkout URL for a given plan and billing interval.
 */
export const getCheckoutUrl = (planName: string, isYearly: boolean): string | null => {
  const normalized = planName.toUpperCase();
  const plan = POLAR_CHECKOUT_URLS[normalized];
  if (!plan) return null;
  return isYearly ? plan.yearly : plan.monthly;
};
