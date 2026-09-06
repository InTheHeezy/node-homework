const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  name: Joi.string().trim().min(3).max(30).required(),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/) 
    .message('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required()
});

module.exports = { userSchema };