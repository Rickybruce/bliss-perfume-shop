const crypto = require('crypto');
const AppError = require('../utils/app-error');
const orderRepo = require('../repositories/order.repository');

async function verify(orderId, code) {
	const conn = await orderRepo.getConnection();
	try {
		await conn.beginTransaction();
		const order = await orderRepo.findOrderForUpdate(conn, orderId);
		if (!order) throw new AppError(404, 'Order not found.');
		if (order.fulfillment_type !== 'ucc_pickup' || order.status !== 'ready') {
			throw new AppError(409, 'This order is not ready for campus pickup.');
		}

		const pickupCode = await orderRepo.findPickupCodeForUpdate(conn, orderId);
		const submittedHash = crypto.createHash('sha256').update(code).digest();
		const storedHash = pickupCode && Buffer.from(pickupCode.code_hash, 'hex');
		if (
			!pickupCode ||
			pickupCode.used_at ||
			!storedHash ||
			storedHash.length !== submittedHash.length ||
			!crypto.timingSafeEqual(storedHash, submittedHash)
		) {
			throw new AppError(400, 'Pickup code is invalid or has already been used.');
		}

		const markedUsed = await orderRepo.markPickupCodeUsed(conn, pickupCode.id);
		if (!markedUsed) throw new AppError(409, 'This pickup code has already been used.');
		await orderRepo.updateStatusInTransaction(conn, orderId, 'collected');
		await conn.commit();
		return { orderId, status: 'collected' };
	} catch (error) {
		await conn.rollback();
		throw error;
	} finally {
		conn.release();
	}
}

module.exports = { verify };
