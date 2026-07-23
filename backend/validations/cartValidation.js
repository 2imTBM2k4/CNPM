import Joi from "joi";

export const cartItemSchema = Joi.object({
  itemId: Joi.string().trim().required().messages({
    "any.required": "itemId is required",
    "string.empty": "itemId must not be empty",
  }),
  quantity: Joi.number().integer().min(1).max(99).optional(),
});
