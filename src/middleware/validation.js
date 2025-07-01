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

const deviceSchema = Joi.object({
  device_name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama device harus diisi",
    "string.min": "Nama device minimal 2 karakter",
    "string.max": "Nama device maksimal 255 karakter",
    "any.required": "Nama device harus diisi",
  }),
  device_type: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Tipe device harus diisi",
    "string.min": "Tipe device minimal 2 karakter",
    "string.max": "Tipe device maksimal 100 karakter",
    "any.required": "Tipe device harus diisi",
  }),
  device_serial: Joi.string().min(5).max(255).required().messages({
    "string.empty": "Serial device harus diisi",
    "string.min": "Serial device minimal 5 karakter",
    "string.max": "Serial device maksimal 255 karakter",
    "any.required": "Serial device harus diisi",
  }),
  location: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Lokasi maksimal 255 karakter",
  }),
  status: Joi.string()
    .valid("active", "inactive", "maintenance")
    .optional()
    .messages({
      "any.only": "Status harus berupa active, inactive, atau maintenance",
    }),
});

const monitoringDataSchema = Joi.object({
  voltage: Joi.number().min(0).max(9999.99).precision(2).required().messages({
    "number.base": "Voltage harus berupa angka",
    "number.min": "Voltage tidak boleh negatif",
    "number.max": "Voltage maksimal 9999.99",
    "any.required": "Voltage harus diisi",
  }),
  current_ampere: Joi.number()
    .min(0)
    .max(999.999)
    .precision(3)
    .required()
    .messages({
      "number.base": "Current ampere harus berupa angka",
      "number.min": "Current ampere tidak boleh negatif",
      "number.max": "Current ampere maksimal 999.999",
      "any.required": "Current ampere harus diisi",
    }),
  power_watts: Joi.number()
    .min(0)
    .max(99999999.99)
    .precision(2)
    .required()
    .messages({
      "number.base": "Power watts harus berupa angka",
      "number.min": "Power watts tidak boleh negatif",
      "number.max": "Power watts maksimal 99999999.99",
      "any.required": "Power watts harus diisi",
    }),
  energy_kwh: Joi.number()
    .min(0)
    .max(9999999.9999)
    .precision(4)
    .required()
    .messages({
      "number.base": "Energy kWh harus berupa angka",
      "number.min": "Energy kWh tidak boleh negatif",
      "number.max": "Energy kWh maksimal 9999999.9999",
      "any.required": "Energy kWh harus diisi",
    }),
  power_factor: Joi.number()
    .min(0)
    .max(1.0)
    .precision(3)
    .optional()
    .allow(null)
    .messages({
      "number.base": "Power factor harus berupa angka",
      "number.min": "Power factor minimal 0",
      "number.max": "Power factor maksimal 1.000",
    }),
  frequency: Joi.number()
    .min(0)
    .max(999.99)
    .precision(2)
    .optional()
    .allow(null)
    .messages({
      "number.base": "Frequency harus berupa angka",
      "number.min": "Frequency tidak boleh negatif",
      "number.max": "Frequency maksimal 999.99",
    }),
  temperature: Joi.number()
    .min(-99.99)
    .max(999.99)
    .precision(2)
    .optional()
    .allow(null)
    .messages({
      "number.base": "Temperature harus berupa angka",
      "number.min": "Temperature minimal -99.99",
      "number.max": "Temperature maksimal 999.99",
    }),
});

const bulkMonitoringDataSchema = Joi.object({
  readings: Joi.array()
    .items(monitoringDataSchema)
    .min(1)
    .max(1000)
    .required()
    .messages({
      "array.base": "Readings harus berupa array",
      "array.min": "Readings minimal berisi 1 data",
      "array.max": "Readings maksimal berisi 1000 data",
      "any.required": "Readings harus diisi",
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
  deviceSchema,
  monitoringDataSchema,
  bulkMonitoringDataSchema,
};
