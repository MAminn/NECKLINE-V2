const { z } = require('zod');

const testimonialSchema = z.object({
  name:     z.string().trim().min(1).max(100),
  product:  z.string().trim().min(1).max(100),
  rating:   z.number().int().min(1).max(5),
  comment:  z.string().trim().min(1).max(1000),
  verified: z.boolean().optional(),
  date:     z.string().min(1),
});

module.exports = { testimonialSchema };
