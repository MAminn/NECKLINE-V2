const { z } = require('zod');

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  phone: z.string().min(1, 'Phone is required').trim(),
});

const shippingAddressSchema = z.object({
  street: z.string().min(1, 'Street is required').trim(),
  city: z.string().min(1, 'City is required').trim(),
  governorate: z.string().min(1, 'Governorate is required').trim(),
  postalCode: z.string().min(1, 'Postal code is required').trim(),
  country: z.string().trim().optional(),
});

const checkoutSchema = z.object({
  body: z.object({
    cartId: z.string().optional().nullable(),
    contact: contactSchema,
    shippingAddress: shippingAddressSchema,
    promoCode: z.string().max(50).trim().optional().nullable(),
  }),
});

const createOrderSchema = z.object({
  body: z.object({
    checkoutToken: z.string().min(1, 'Checkout token is required'),
    paymentMethod: z.enum(['stub', 'paymob']).optional().default('stub'),
  }),
});

const orderLookupSchema = z.object({
  params: z.object({
    orderNumber: z.string().min(1, 'Order number is required'),
  }),
  query: z.object({
    email: z.string().email().optional(),
  }),
});

module.exports = {
  checkoutSchema,
  createOrderSchema,
  orderLookupSchema,
};
