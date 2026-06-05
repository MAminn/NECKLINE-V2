const { z } = require('zod');

const promoCodeTypeEnum = z.enum(['percentage', 'fixed', 'free_shipping']);

const createPromoCodeBody = z.object({
  code: z.string().trim().min(1).max(50).optional(),
  type: promoCodeTypeEnum,
  value: z.number().int().min(0),
  minOrderAmount: z.number().int().min(0).default(0),
  maxDiscountAmount: z.number().int().min(0).nullable().default(null),
  usageLimit: z.number().int().min(1).nullable().default(null),
  startDate: z.string().datetime().nullable().default(null),
  endDate: z.string().datetime().nullable().default(null),
  active: z.boolean().default(true),
  isAutomatic: z.boolean().default(false),
  description: z.string().trim().max(500).optional(),
}).refine(
  (data) => {
    if (data.isAutomatic) return !data.code;
    return !!data.code;
  },
  { message: 'Manual codes require a code; automatic offers must not have one' }
).refine(
  (data) => {
    if (data.type === 'percentage') return data.value <= 100;
    return true;
  },
  { message: 'Percentage discount value cannot exceed 100' }
).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  { message: 'endDate must be after startDate' }
);

const createPromoCodeSchema = z.object({ body: createPromoCodeBody });

const updatePromoCodeBody = z.object({
  type: promoCodeTypeEnum.optional(),
  value: z.number().int().min(0).optional(),
  minOrderAmount: z.number().int().min(0).optional(),
  maxDiscountAmount: z.number().int().min(0).nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
  isAutomatic: z.boolean().optional(),
  description: z.string().trim().max(500).optional(),
}).refine(
  (data) => {
    if (data.type === 'percentage' && data.value !== undefined) {
      return data.value <= 100;
    }
    return true;
  },
  { message: 'Percentage discount value cannot exceed 100' }
).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  { message: 'endDate must be after startDate' }
);

const updatePromoCodeSchema = z.object({ body: updatePromoCodeBody });

const applyPromoSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1).max(50),
  }),
});

module.exports = {
  createPromoCodeSchema,
  updatePromoCodeSchema,
  applyPromoSchema,
};
