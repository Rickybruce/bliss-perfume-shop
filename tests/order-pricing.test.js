jest.mock('../src/repositories/order.repository', () => ({
	getConnection: jest.fn(),
	findVariantForUpdate: jest.fn(),
	decrementStock: jest.fn(),
	createOrder: jest.fn(),
	addOrderItem: jest.fn(),
}));

const orderRepo = require('../src/repositories/order.repository');
const orderService = require('../src/services/order.service');

describe('order pricing', () => {
	beforeEach(() => jest.clearAllMocks());

	test('calculates item totals and fulfillment fees in integer pesewas', () => {
		const items = [
			{ price_pesewas: 12500, quantity: 2 },
			{ price_pesewas: 7999, quantity: 1 },
		];

		expect(orderService.calculateOrderTotals(items, orderService.DELIVERY_FEES_PESEWAS.junction)).toEqual({
			subtotalPesewas: 32999,
			totalPesewas: 33499,
		});
	});

	test('uses the configured integer fee for each fulfillment choice', () => {
		expect(orderService.DELIVERY_FEES_PESEWAS).toEqual({
			ucc_pickup: 0,
			junction: 500,
			house_delivery: 1000,
		});
	});

	test('uses locked database prices instead of any client-supplied price', async () => {
		const connection = {
			beginTransaction: jest.fn(),
			commit: jest.fn(),
			rollback: jest.fn(),
			release: jest.fn(),
		};
		orderRepo.getConnection.mockResolvedValue(connection);
		orderRepo.findVariantForUpdate.mockResolvedValue({
			id: 12,
			product_name: 'Citrus Bloom',
			size_ml: 50,
			price_pesewas: 12500,
			stock: 2,
		});
		orderRepo.decrementStock.mockResolvedValue(true);
		orderRepo.createOrder.mockResolvedValue(73);

		const order = await orderService.create(5, {
			fulfillmentType: 'junction',
			junctionName: 'Abura',
			items: [{ variantId: 12, quantity: 1, pricePesewas: 1 }],
		});

		expect(order.totalPesewas).toBe(13000);
		expect(orderRepo.createOrder).toHaveBeenCalledWith(connection, expect.objectContaining({
			totalPesewas: 13000,
			deliveryFeePesewas: 500,
		}));
		expect(orderRepo.addOrderItem).toHaveBeenCalledWith(connection, 73, expect.objectContaining({
			unitPricePesewas: 12500,
		}));
		expect(connection.commit).toHaveBeenCalledTimes(1);
		expect(connection.release).toHaveBeenCalledTimes(1);
	});
});
