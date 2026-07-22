import Joi from "joi";

export const addFoodSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "any.required": "Tên món ăn là bắt buộc",
    "string.min": "Tên món ăn phải có ít nhất 2 ký tự",
  }),
  description: Joi.string().trim().max(500).required().messages({
    "any.required": "Mô tả là bắt buộc",
  }),
  price: Joi.number().positive().required().messages({
    "number.positive": "Giá phải là số dương",
    "any.required": "Giá là bắt buộc",
  }),
  category: Joi.string().trim().min(1).max(50).required().messages({
    "any.required": "Danh mục là bắt buộc",
  }),
});

export const updateFoodSchema = Joi.object({
  id: Joi.string().trim().required().messages({
    "any.required": "ID món ăn là bắt buộc",
  }),
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500),
  price: Joi.number().positive().messages({
    "number.positive": "Giá phải là số dương",
  }),
  category: Joi.string().trim().min(1).max(50),
});

export const removeFoodSchema = Joi.object({
  id: Joi.string().trim().required().messages({
    "any.required": "ID món ăn là bắt buộc",
  }),
});

export const listFoodQuerySchema = Joi.object({
  restaurantId: Joi.string().trim().allow("", null),
});
