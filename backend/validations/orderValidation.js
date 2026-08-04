import Joi from "joi";

// NOTE: items, amount and restaurantId are accepted for backward compatibility
// with older clients but are IGNORED. The order is built from the user's
// server-side cart and priced from the database — see orderService.placeOrder.
export const placeOrderSchema = Joi.object({
  items: Joi.array().items(Joi.object().unknown(true)).optional(),
  address: Joi.object().required().messages({
    "any.required": "Địa chỉ giao hàng là bắt buộc",
  }),
  amount: Joi.number().optional(),
  paymentMethod: Joi.string()
    .valid("COD", "Card", "PayPal")
    .required()
    .messages({
      "any.only": "Phương thức thanh toán không hợp lệ (COD, Card, PayPal)",
      "any.required": "Phương thức thanh toán là bắt buộc",
    }),
  restaurantId: Joi.alternatives()
    .try(Joi.string().trim(), Joi.object())
    .optional(),
  paymentDetails: Joi.object().allow(null),
});

export const updateStatusSchema = Joi.object({
  orderId: Joi.string().trim().required().messages({
    "any.required": "orderId là bắt buộc",
  }),
  status: Joi.string()
    .valid("pending", "preparing", "delivering", "delivered", "cancelled")
    .required()
    .messages({
      "any.only":
        "Trạng thái không hợp lệ (pending, preparing, delivering, delivered, cancelled)",
      "any.required": "Trạng thái là bắt buộc",
    }),
  reason: Joi.string().trim().max(500).allow("", null),
  isPaid: Joi.boolean(),
  paidAt: Joi.date(),
});

export const verifyOrderSchema = Joi.object({
  orderId: Joi.string().trim().required().messages({
    "any.required": "orderId là bắt buộc",
  }),
  success: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .required()
    .messages({
      "any.required": "success là bắt buộc",
    }),
});
