const {
	updateProductSchema,
	updateVariantSchema,
	addVariantSchema,
	addImageSchema,
} = require('../src/validators/product.validator');

describe('admin product edit validation', () => {
	test('PATCH product needs at least one field', () => {
		expect(updateProductSchema.safeParse({}).success).toBe(false);
		expect(updateProductSchema.safeParse({ is_published: false }).success).toBe(true);
	});

	test('PATCH product rejects an unknown concentration', () => {
		expect(updateProductSchema.safeParse({ concentration: 'Cologne' }).success).toBe(false);
	});

	test('variant price must be a positive whole number of pesewas', () => {
		expect(updateVariantSchema.safeParse({ price_pesewas: 35000 }).success).toBe(true);
		expect(updateVariantSchema.safeParse({ price_pesewas: 0 }).success).toBe(false);
		expect(updateVariantSchema.safeParse({ price_pesewas: 350.5 }).success).toBe(false);
	});

	test('variant stock cannot be negative', () => {
		expect(updateVariantSchema.safeParse({ stock: -1 }).success).toBe(false);
		expect(updateVariantSchema.safeParse({ stock: 0 }).success).toBe(true);
	});

	test('new size needs size and price, stock defaults to 0', () => {
		const result = addVariantSchema.safeParse({ size_ml: 50, price_pesewas: 20000 });
		expect(result.success).toBe(true);
		expect(result.data.stock).toBe(0);
		expect(addVariantSchema.safeParse({ size_ml: 50 }).success).toBe(false);
	});

	test('image link must be https or a local /images path', () => {
		expect(addImageSchema.safeParse({ url: 'https://res.cloudinary.com/x/a.webp' }).success).toBe(true);
		expect(addImageSchema.safeParse({ url: '/images/a.webp' }).success).toBe(true);
		expect(addImageSchema.safeParse({ url: 'javascript:alert(1)' }).success).toBe(false);
		expect(addImageSchema.safeParse({ url: 'http://insecure.example/a.png' }).success).toBe(false);
	});
});
