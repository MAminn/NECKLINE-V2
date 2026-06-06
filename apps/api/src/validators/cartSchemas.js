const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID');

const addItemSchema = z.object({
  body: z.object({
    productId: objectId,
    quantity: z.coerce.number().int().min(1).max(99).optional(),
  }),
});

const updateItemSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
  body: z.object({
    quantity: z.coerce.number().int().min(1).max(99),
  }),
});

const itemParamsSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});

module.exports = { addItemSchema, updateItemSchema, itemParamsSchema };
