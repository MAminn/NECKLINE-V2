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
  linkTo:      z.enum(['collection', 'story', 'reviews']).optional(),
  order:       z.number().int().optional(),
  active:      z.boolean().optional(),
});

const howToApplyStepSchema = z.object({
  num:           z.string().min(1),
  title:         z.string().trim().min(1),
  desc:          z.string().trim().min(1),
  iconType:      z.enum(['preset', 'custom']),
  presetName:    z.string().optional(),
  customIconUrl: z.string().optional(),
});

const howToApplySchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  steps: z.array(howToApplyStepSchema).min(1),
});

module.exports = { testimonialSchema, headerSlideSchema, howToApplySchema };
