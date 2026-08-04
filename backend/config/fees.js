/**
 * Single source of truth for order pricing. The frontend reads these from
 * GET /api/config/fees rather than hardcoding them, and the server always
 * recomputes totals from these values — never from what the client sends.
 */
export const DELIVERY_FEE = 2;
export const SERVICE_FEE = 0;

export const computeOrderTotals = (subtotal) => {
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  const serviceFee = subtotal > 0 ? SERVICE_FEE : 0;
  return {
    subtotal,
    deliveryFee,
    serviceFee,
    total: subtotal + deliveryFee + serviceFee,
  };
};
