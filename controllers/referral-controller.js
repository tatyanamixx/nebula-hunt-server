/**
 * Referral Controller
 */
const referralService = require("../service/referral-service");
const logger = require("../service/logger-service");
const ApiError = require("../exceptions/api-error");
const { ERROR_CODES } = require("../config/error-codes");

class ReferralController {
	/**
	 * Process referral - give rewards to both referrer and referee
	 */
	async processReferral(req, res, next) {
		try {
			const refereeId = req.initdata.id; // Current user (who joined via referral link)
			const { referrerId } = req.body;

			if (!referrerId) {
				return next(
					ApiError.withCode(
						400,
						"Referrer ID is required",
						ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
					)
				);
			}

			logger.debug("Processing referral", {
				referrerId,
				refereeId,
			});

			const result = await referralService.processReferral(
				referrerId,
				refereeId
			);

			return res.json(result);
		} catch (error) {
			logger.error("Failed to process referral", {
				error: error.message,
			});
			next(error);
		}
	}

	/**
	 * Get user's referrals (friends list)
	 */
	async getUserReferrals(req, res, next) {
		try {
			const userId = req.initdata.id;

			logger.debug("Getting user referrals", { userId });

			const result = await referralService.getUserReferrals(userId);

			return res.json(result);
		} catch (error) {
			logger.error("Failed to get user referrals", {
				error: error.message,
			});
			next(error);
		}
	}
}

module.exports = new ReferralController();

