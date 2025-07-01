const Joi = require("joi");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errorMessage,
      });
    }

    next();
  };
};

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Nama harus diisi",
    "string.min": "Nama minimal 2 karakter",
    "string.max": "Nama maksimal 100 karakter",
    "any.required": "Nama harus diisi",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Format email tidak valid",
    "string.empty": "Email harus diisi",
    "any.required": "Email harus diisi",
  }),
  password: Joi.string().min(6).max(100).required().messages({
    "string.min": "Password minimal 6 karakter",
    "string.max": "Password maksimal 100 karakter",
    "string.empty": "Password harus diisi",
    "any.required": "Password harus diisi",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Konfirmasi password tidak cocok",
    "any.required": "Konfirmasi password harus diisi",
  }),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .min(10)
    .max(20)
    .optional()
    .messages({
      "string.pattern.base": "Format nomor telepon tidak valid",
      "string.min": "Nomor telepon minimal 10 karakter",
      "string.max": "Nomor telepon maksimal 20 karakter",
    }),
  address: Joi.string().max(500).optional().messages({
    "string.max": "Alamat maksimal 500 karakter",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Format email tidak valid",
    "string.empty": "Email harus diisi",
    "any.required": "Email harus diisi",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password harus diisi",
    "any.required": "Password harus diisi",
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Format email tidak valid",
    "string.empty": "Email harus diisi",
    "any.required": "Email harus diisi",
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Token reset harus diisi",
    "any.required": "Token reset harus diisi",
  }),
  password: Joi.string().min(6).max(100).required().messages({
    "string.min": "Password minimal 6 karakter",
    "string.max": "Password maksimal 100 karakter",
    "string.empty": "Password harus diisi",
    "any.required": "Password harus diisi",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Konfirmasi password tidak cocok",
    "any.required": "Konfirmasi password harus diisi",
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Password saat ini harus diisi",
    "any.required": "Password saat ini harus diisi",
  }),
  newPassword: Joi.string().min(6).max(100).required().messages({
    "string.min": "Password baru minimal 6 karakter",
    "string.max": "Password baru maksimal 100 karakter",
    "string.empty": "Password baru harus diisi",
    "any.required": "Password baru harus diisi",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Konfirmasi password tidak cocok",
      "any.required": "Konfirmasi password harus diisi",
    }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Nama harus diisi",
    "string.min": "Nama minimal 2 karakter",
    "string.max": "Nama maksimal 100 karakter",
    "any.required": "Nama harus diisi",
  }),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .min(10)
    .max(20)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Format nomor telepon tidak valid",
      "string.min": "Nomor telepon minimal 10 karakter",
      "string.max": "Nomor telepon maksimal 20 karakter",
    }),
  address: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Alamat maksimal 500 karakter",
  }),
});

module.exports = {
  validateRequest,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
};
