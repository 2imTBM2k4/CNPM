import Joi from "joi";

export const placeOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().required(),
        name: Joi.string(),
        price: Joi.number(),
        quantity: Joi.number().integer().positive(),
      }).unknown(true)
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Đơn hàng phải có ít nhất 1 món",
      "any.required": "Danh sách món là bắt buộc",
    }),
  address: Joi.object().required().messages({
    "any.required": "Địa chỉ giao hàng là bắt buộc",
  }),
  amount: Joi.number().positive().required().messages({
    "number.positive": "Tổng tiền phải là số dương",
    "any.required": "Tổng tiền là bắt buộc",
  }),
  paymentMethod: Joi.string()
    .valid("COD", "Card", "PayPal")
    .required()
    .messages({
      "any.only": "Phương thức thanh toán không hợp lệ (COD, Card, PayPal)",
      "any.required": "Phương thức thanh toán là bắt buộc",
    }),
  restaurantId: Joi.alternatives()
    .try(Joi.string().trim(), Joi.object())
    .required()
    .messages({
      "any.required": "restaurantId là bắt buộc",
    }),
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
    .required(),
});
