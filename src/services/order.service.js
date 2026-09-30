const crypto = require('crypto');
const AppError = require('../utils/app-error');
const orderRepo = require('../repositories/order.repository');

const DELIVERY_FEES_PESEWAS = Object.freeze({
	ucc_pickup: 0,
	junction: 500,
	house_delivery: 1000,
});

function calculateOrderTotals(items, deliveryFeePesewas) {
	const subtotalPesewas = items.reduce((subtotal, item) => {
		return subtotal + item.price_pesewas * item.quantity;
	}, 0);
	const totalPesewas = subtotalPesewas + deliveryFeePesewas;

	if (!Number.isSafeInteger(subtotalPesewas) || !Number.isSafeInteger(totalPesewas)) {
		throw new AppError(400, 'This order total is too large.');
	}

	return { subtotalPesewas, totalPesewas };
}

function createPickupCode() {
	const code = String(crypto.randomInt(100000, 1000000));
	return { code, hash: crypto.createHash('sha256').update(code).digest('hex') };
}

async function create(userId, checkout) {
	const quantitiesByVariant = new Map();
	for (const item of checkout.items) {
		const quantity = (quantitiesByVariant.get(item.variantId) || 0) + item.quantity;
		if (quantity > 20) throw new AppError(400, 'A maximum of 20 units per variant can be ordered.');
		quantitiesByVariant.set(item.variantId, quantity);
	}

	const conn = await orderRepo.getConnection();
	try {
		await conn.beginTransaction();
		const items = [];

		for (const [variantId, quantity] of quantitiesByVariant) {
			const variant = await orderRepo.findVariantForUpdate(conn, variantId);
			if (!variant) throw new AppError(404, 'One of the selected products is no longer available.');
			if (variant.stock < quantity) {
				throw new AppError(409, `${variant.product_name} has only ${variant.stock} left in stock.`);
			}
			if (!(await orderRepo.decrementStock(conn, variantId, quantity))) {
				throw new AppError(409, `${variant.product_name} is no longer available in that quantity.`);
			}
			items.push({ ...variant, quantity });
		}

		const deliveryFeePesewas = DELIVERY_FEES_PESEWAS[checkout.fulfillmentType];
		const { subtotalPesewas, totalPesewas } = calculateOrderTotals(items, deliveryFeePesewas);
		let deliveryAddressId = null;
		if (checkout.fulfillmentType === 'house_delivery') {
			deliveryAddressId = await orderRepo.createAddress(conn, userId, checkout.address);
		}

		const orderId = await orderRepo.createOrder(conn, {
			userId,
			fulfillmentType: checkout.fulfillmentType,
			deliveryAddressId,
			junctionName: checkout.junctionName,
			deliveryFeePesewas,
			totalPesewas,
		});

		for (const item of items) {
			await orderRepo.addOrderItem(conn, orderId, {
				productVariantId: item.id,
				productName: item.product_name,
				sizeMl: item.size_ml,
				unitPricePesewas: item.price_pesewas,
				quantity: item.quantity,
			});
		}

		let pickupCode;
		if (checkout.fulfillmentType === 'ucc_pickup') {
			const generatedCode = createPickupCode();
			await orderRepo.createPickupCode(conn, orderId, generatedCode.hash);
			pickupCode = generatedCode.code;
		}

		await conn.commit();
		return {
			id: orderId,
			status: 'pending',
			fulfillmentType: checkout.fulfillmentType,
			subtotalPesewas,
			deliveryFeePesewas,
			totalPesewas,
			pickupCode,
		};
	} catch (error) {
		await conn.rollback();
		throw error;
	} finally {
		conn.release();
	}
}

async function listForUser(userId) {
	return orderRepo.listForUser(userId);
}

async function getForUser(orderId, userId) {
	const order = await orderRepo.findByIdForUser(orderId, userId);
	if (!order) throw new AppError(404, 'Order not found.');
	order.items = await orderRepo.findItemsByOrderId(orderId);
	return order;
}

async function listForAdmin(status) {
	return orderRepo.listForAdmin(status);
}

async function getForAdmin(orderId) {
	const order = await orderRepo.findByIdForAdmin(orderId);
	if (!order) throw new AppError(404, 'Order not found.');
	order.items = await orderRepo.findItemsByOrderId(orderId);
	return order;
}

async function updateStatus(orderId, status) {
	const conn = await orderRepo.getConnection();
	try {
		await conn.beginTransaction();
		const order = await orderRepo.findOrderForUpdate(conn, orderId);
		if (!order) throw new AppError(404, 'Order not found.');
		if (order.status === 'cancelled' && status !== 'cancelled') {
			throw new AppError(409, 'A cancelled order cannot be reopened.');
		}

		if (status === 'cancelled' && order.status !== 'cancelled') {
			const items = await orderRepo.findItemsForUpdate(conn, orderId);
			for (const item of items) {
				await orderRepo.restoreStock(conn, item.product_variant_id, item.quantity);
			}
		}

		await orderRepo.updateStatusInTransaction(conn, orderId, status);
		await conn.commit();
		return { id: orderId, status };
	} catch (error) {
		await conn.rollback();
		throw error;
	} finally {
		conn.release();
	}
}

module.exports = {
	create,
	listForUser,
	getForUser,
	listForAdmin,
	getForAdmin,
	updateStatus,
	calculateOrderTotals,
	DELIVERY_FEES_PESEWAS,
};
