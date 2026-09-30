const crypto = require('crypto');

jest.mock('../src/repositories/order.repository', () => ({
	getConnection: jest.fn(),
	findOrderForUpdate: jest.fn(),
	findPickupCodeForUpdate: jest.fn(),
	markPickupCodeUsed: jest.fn(),
	updateStatusInTransaction: jest.fn(),
}));

const orderRepo = require('../src/repositories/order.repository');
const pickupService = require('../src/services/pickup.service');

describe('campus pickup code verification', () => {
	let connection;

	beforeEach(() => {
		jest.clearAllMocks();
		connection = {
			beginTransaction: jest.fn(),
			commit: jest.fn(),
			rollback: jest.fn(),
			release: jest.fn(),
		};
		orderRepo.getConnection.mockResolvedValue(connection);
		orderRepo.findOrderForUpdate.mockResolvedValue({
			id: 31,
			fulfillment_type: 'ucc_pickup',
			status: 'ready',
		});
		orderRepo.findPickupCodeForUpdate.mockResolvedValue({
			id: 8,
			code_hash: crypto.createHash('sha256').update('123456').digest('hex'),
			used_at: null,
		});
		orderRepo.markPickupCodeUsed.mockResolvedValue(true);
	});

	test('marks the code used and the ready order collected atomically', async () => {
		await expect(pickupService.verify(31, '123456')).resolves.toEqual({
			orderId: 31,
			status: 'collected',
		});

		expect(orderRepo.markPickupCodeUsed).toHaveBeenCalledWith(connection, 8);
		expect(orderRepo.updateStatusInTransaction).toHaveBeenCalledWith(connection, 31, 'collected');
		expect(connection.commit).toHaveBeenCalledTimes(1);
	});

	test('rejects an incorrect code and rolls back without collecting the order', async () => {
		await expect(pickupService.verify(31, '654321')).rejects.toMatchObject({ statusCode: 400 });

		expect(orderRepo.markPickupCodeUsed).not.toHaveBeenCalled();
		expect(orderRepo.updateStatusInTransaction).not.toHaveBeenCalled();
		expect(connection.rollback).toHaveBeenCalledTimes(1);
	});

	test('rejects campus codes for non-campus orders', async () => {
		orderRepo.findOrderForUpdate.mockResolvedValue({
			id: 31,
			fulfillment_type: 'junction',
			status: 'ready',
		});

		await expect(pickupService.verify(31, '123456')).rejects.toMatchObject({ statusCode: 409 });
		expect(connection.rollback).toHaveBeenCalledTimes(1);
	});
});
