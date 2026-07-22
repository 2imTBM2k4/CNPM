import Joi from "joi";

export const cartItemSchema = Joi.object({
  itemId: Joi.string().trim().required().messages({
    "any.required": "itemId là bắt buộc",
    "string.empty": "itemId không được để trống",
  }),
});
