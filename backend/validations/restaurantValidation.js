import Joi from "joi";

export const createRestaurantSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "any.required": "Tên nhà hàng là bắt buộc",
    "string.min": "Tên nhà hàng phải có ít nhất 2 ký tự",
  }),
  address: Joi.string().trim().max(200).allow("", null),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{8,15}$/)
    .allow("", null)
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ",
    }),
  email: Joi.string().trim().email().allow("", null),
  description: Joi.string().trim().max(500).allow("", null),
});

export const updateRestaurantSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  address: Joi.string().trim().max(200).allow("", null),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{8,15}$/)
    .allow("", null),
  email: Joi.string().trim().email().allow("", null),
  description: Joi.string().trim().max(500).allow("", null),
});

export const deleteRestaurantSchema = Joi.object({
  id: Joi.string().trim().required().messages({
    "any.required": "ID nhà hàng là bắt buộc",
  }),
});

export const lockRestaurantSchema = Joi.object({
  isLocked: Joi.boolean().required().messages({
    "any.required": "isLocked là bắt buộc",
  }),
});

export const setOpenStateSchema = Joi.object({
  isOpen: Joi.boolean().required().messages({
    "any.required": "isOpen là bắt buộc",
  }),
});
