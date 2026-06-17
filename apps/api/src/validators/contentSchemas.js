const { z } = require('zod');

const testimonialSchema = z.object({
  name:     z.string().trim().min(1).max(100),
  product:  z.string().trim().min(1).max(100),
  rating:   z.number().int().min(1).max(5),
  comment:  z.string().trim().min(1).max(1000),
  verified: z.boolean().optional(),
  date:     z.string().min(1),
});

const headerSlideSchema = z.object({
  image:       z.string().trim().min(1),
  title:       z.string().trim().min(1).max(100),
  subtitle:    z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
  buttonText:  z.string().trim().max(50).optional(),
  linkTo:      z.enum(['collection', 'story', 'reviews', 'shop']).optional(),
  order:       z.number().int().optional(),
  active:      z.boolean().optional(),
});

module.exports = { testimonialSchema, headerSlideSchema };
