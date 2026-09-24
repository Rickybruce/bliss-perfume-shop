const { z } = require('zod');

const orderItemSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive().max(20),
});

// Address is only required when fulfillmentType is 'house_delivery' — the
// controller checks that, since it depends on another field's value.
const addressSchema = z.object({
  line1: z.string().trim().min(1, 'Enter the delivery address.').max(190),
  city: z.string().trim().min(1, 'Enter a city or town.').max(100),
  landmark: z.string().trim().max(190).optional(),
});

const checkoutSchema = z
  .object({
    items: z.array(orderItemSchema).min(1, 'Your cart is empty.'),
    fulfillmentType: z.enum(['junction', 'house_delivery', 'ucc_pickup']),
    junctionName: z.string().trim().max(120).optional(),
    address: addressSchema.optional(),
  })
  .refine(
    (data) => data.fulfillmentType !== 'junction' || (data.junctionName && data.junctionName.length > 0),
    { message: 'Enter which junction you\'ll collect from.', path: ['junctionName'] }
  )
  .refine(
    (data) => data.fulfillmentType !== 'house_delivery' || data.address,
    { message: 'Enter a delivery address.', path: ['address'] }
  );

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'packed', 'ready', 'shipped', 'collected', 'cancelled']),
});

const verifyPickupSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit pickup code.'),
});

module.exports = { checkoutSchema, updateOrderStatusSchema, verifyPickupSchema };