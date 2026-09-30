const AppError = require('../utils/app-error');
const orderService = require('../services/order.service');

function parseOrderId(value) {
	const orderId = Number(value);
	if (!Number.isSafeInteger(orderId) || orderId < 1) throw new AppError(400, 'Invalid order ID.');
	return orderId;
}

async function create(req, res, next) {
	try {
		const order = await orderService.create(req.user.id, req.body);
		res.status(201).json(order);
	} catch (error) {
		next(error);
	}
}

async function listForUser(req, res, next) {
	try {
		const orders = await orderService.listForUser(req.user.id);
		res.json({ orders });
	} catch (error) {
		next(error);
	}
}

async function getForUser(req, res, next) {
	try {
		const order = await orderService.getForUser(parseOrderId(req.params.id), req.user.id);
		res.json(order);
	} catch (error) {
		next(error);
	}
}

module.exports = { create, listForUser, getForUser, parseOrderId };
