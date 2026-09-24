// Query-param validation for GET /api/products.
// No body schema is needed for read-only routes, but query params are still
// validated so the repository never receives unexpected values.
const { z } = require('zod');

// Valid concentration values must match the ENUM in the schema.
const CONCENTRATIONS = ['EDT', 'EDP', 'Extrait', 'Parfum'];

const listProductsQuerySchema = z.object({
  scentFamily: z.string().trim().min(1).max(50).optional(),
  concentration: z.enum(CONCENTRATIONS).optional(),
});

const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required.').max(150),
  brand: z.string().trim().max(100).optional().or(z.literal('')),
  description: z.string().trim().optional().or(z.literal('')),
  scent_family: z.string().trim().max(50).optional().or(z.literal('')),
  top_notes: z.string().trim().max(190).optional().or(z.literal('')),
  middle_notes: z.string().trim().max(190).optional().or(z.literal('')),
  base_notes: z.string().trim().max(190).optional().or(z.literal('')),
  concentration: z.enum(CONCENTRATIONS).optional().or(z.literal('')),
  is_published: z.boolean().optional().default(false),
  size_ml: z.coerce.number().int().positive('Size (ml) must be greater than 0.'),
  price_pesewas: z.coerce.number().int().positive('Price must be greater than 0 pesewas.'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative.').default(0),
  sku: z.string().trim().max(40).optional().or(z.literal('')),
  image_url: z.string().trim().max(300).optional().or(z.literal('')),
});

module.exports = { listProductsQuerySchema, createProductSchema, CONCENTRATIONS };
