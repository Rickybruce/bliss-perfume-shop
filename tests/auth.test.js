const { normalisePhone } = require('../src/utils/phone');
const { registerSchema, loginSchema } = require('../src/validators/auth.validator');

describe('normalisePhone', () => {
	test.each([
		['0241234567', '+233241234567'],
		['024 123 4567', '+233241234567'],
		['+233241234567', '+233241234567'],
		['233241234567', '+233241234567'],
	])('%s -> %s', (input, expected) => {
		expect(normalisePhone(input)).toBe(expected);
	});

	test.each(['12345', '0141234567', '', 'abc', null, undefined])('rejects %p', (input) => {
		expect(normalisePhone(input)).toBeNull();
	});
});

describe('registerSchema', () => {
	const valid = { username: 'ama_k', email: 'Ama@Example.com', phone: '0241234567', password: 'longenough1' };

	test('accepts a valid sign-up and lowercases the email', () => {
		const result = registerSchema.safeParse(valid);
		expect(result.success).toBe(true);
		expect(result.data.email).toBe('ama@example.com');
	});

	test('rejects a short password', () => {
		expect(registerSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
	});

	test('rejects a username with spaces', () => {
		expect(registerSchema.safeParse({ ...valid, username: 'ama k' }).success).toBe(false);
	});
});

describe('loginSchema', () => {
	test('defaults remember to false', () => {
		const result = loginSchema.safeParse({ identifier: 'ama_k', password: 'x' });
		expect(result.success).toBe(true);
		expect(result.data.remember).toBe(false);
	});
});
