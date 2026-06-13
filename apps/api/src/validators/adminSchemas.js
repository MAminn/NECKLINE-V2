const { z } = require('zod');

const createProductSchema = z.object({
  name:         z.string().trim().min(1),
  sku:          z.string().trim().min(1),
  category:     z.string().trim().optional(),
  price:        z.number().int().positive(),
  currency:     z.string().default('EGP'),
  stockOnHand:  z.number().int().min(0),
  subtitle:     z.string().trim().max(200).optional(),
  description:  z.string().trim().optional(),
  images:       z.array(z.string()).optional(),
  tags:         z.array(z.string().trim()).optional(),
  purchasable:  z.boolean().optional(),
});

const updateProductSchema = createProductSchema.partial();

const updateOrderSchema = z.object({
  fulfillmentStatus: z.enum(['unfulfilled', 'processing', 'shipped', 'delivered']).optional(),
  trackingNumber:    z.string().trim().optional(),
});

const createCouponSchema = z.object({
  code:           z.string().trim().min(1).toUpperCase(),
  type:           z.enum(['percentage', 'fixed']),
  value:          z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  usageLimit:     z.number().int().positive().optional(),
  endDate:        z.string().optional(),
});

const createOfferSchema = z.object({
  description:    z.string().trim().min(1),
  type:           z.enum(['percentage', 'fixed']),
  value:          z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  endDate:        z.string().optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateOrderSchema,
  createCouponSchema,
  createOfferSchema,
};
