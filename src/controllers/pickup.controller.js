const pickupService = require('../services/pickup.service');

async function verify(req, res, next) {
	try {
		const result = await pickupService.verify(req.body.orderId, req.body.code);
		res.json({ ...result, message: 'Pickup verified. Order marked as collected.' });
	} catch (error) {
		next(error);
	}
}

module.exports = { verify };
