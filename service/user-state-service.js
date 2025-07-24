/**
 * created by Tatyana Mikhniukevich on 08.05.2025
 */
const { UserState, User } = require('../models/models');
const logger = require('./logger-service');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op } = require('sequelize');
const {
	LEADERBOARD_LIMIT,
	DAILY_BONUS_STARDUST,
} = require('../config/constants');

class UserStateService {
	async updateStreak(userState) {
		const now = new Date();
		// const today = new Date(
		// 	now.getFullYear(),
		// 	now.getMonth(),
		// 	now.getDate()
		// );

		const today = new Date(now);
		const lastLogin = userState.lastLoginDate
			? new Date(userState.lastLoginDate)
			: null;

		// If this is the first login ever
		if (!lastLogin) {
			userState.lastLoginDate = today;
			userState.currentStreak = 1;
			userState.maxStreak = 1;
			userState.streakUpdatedAt = now;
			return;
		}

		// If already updated today, skip
		if (
			userState.streakUpdatedAt &&
			new Date(userState.streakUpdatedAt).toDateString() ===
				today.toDateString()
		) {
			return;
		}

		// Calculate the difference in hours
		const diffDays = Math.floor(
			(today - lastLogin) / (1000 * 60 * 60 * 24)
		);

		if (diffDays === 1) {
			// Consecutive day
			userState.currentStreak += 1;
			userState.maxStreak = Math.max(
				userState.currentStreak,
				userState.maxStreak
			);
		} else if (diffDays > 1) {
			// Streak broken
			userState.currentStreak = 1;
		}

		userState.lastLoginDate = today;
		userState.streakUpdatedAt = now;
		userState.updatedAt = now;
		userState.stateHistory.push({
			timestamp: now,
			state: userState.toJSON(),
		});
	}

	async getUserState(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;
		try {
			// Get basic user state
			let userState = await UserState.findOne({
				where: { userId: userId },
				transaction: t,
			});

			if (userState) {
				// Update streak information
				await this.updateStreak(userState);
				await userState.save({ transaction: t });

				if (shouldCommit) {
					await t.commit();
				}
				return userState.toJSON();
			}
			if (shouldCommit) {
				await t.commit();
			}
			return userState;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(`Failed to get user state: ${err.message}`);
		}
	}

	async createUserState(userId, userState, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;
		try {
			await this.updateStreak(userState);
			logger.debug('createUserState', userId, userState);
			// Create new state for new user
			const stateNew = await UserState.findOrCreate({
				where: { userId: userId },
				defaults: {
					userId: userId,
					stardust: userState.stardust || 0,
					darkMatter: userState.darkMatter || 0,
					tgStars: userState.tgStars || 0,
					lockedStardust: userState.lockedStardust || 0,
					lockedDarkMatter: userState.lockedDarkMatter || 0,
					lockedTgStars: userState.lockedTgStars || 0,
					lastDailyBonus: userState.lastDailyBonus || null,
					lastLoginDate: userState.lastLoginDate || null,
					currentStreak: userState.currentStreak || 0,
					maxStreak: userState.maxStreak || 0,
					streakUpdatedAt: userState.streakUpdatedAt || null,
					stateHistory: userState.stateHistory || [],
				},
				transaction: t,
			});
			if (shouldCommit) {
				await t.commit();
			}
			return stateNew[0].toJSON();
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(
				`Failed to create/update user state: ${err.message}`
			);
		}
	}

	async updateUserState(userId, userState, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			const stateData = await UserState.findOne({
				where: { userId: userId },
				transaction: t,
			});

			if (stateData) {
				// Update basic state fields
				stateData.state = userState.state;
				stateData.chaosLevel =
					userState.chaosLevel !== undefined
						? userState.chaosLevel
						: stateData.chaosLevel;
				stateData.stabilityLevel =
					userState.stabilityLevel !== undefined
						? userState.stabilityLevel
						: stateData.stabilityLevel;
				stateData.entropyVelocity =
					userState.entropyVelocity !== undefined
						? userState.entropyVelocity
						: stateData.entropyVelocity;
				stateData.stateHistory.push({
					timestamp: new Date(),
					state: stateData.toJSON(),
				});

				// Update streak information
				await this.updateStreak(stateData);
				await stateData.save({ transaction: t });

				// Prepare response object
				const responseObj = {
					userId,
					userState: stateData.toJSON
						? stateData.toJSON()
						: { ...stateData },
				};

				if (shouldCommit) {
					await t.commit();
				}
				return responseObj;
			}

			// Create new state for new user
			const stateNew = await UserState.create(
				{
					userId: userId,
					state: userState.state,
					chaosLevel: userState.chaosLevel || 0.0,
					stabilityLevel: userState.stabilityLevel || 0.0,
					entropyVelocity: userState.entropyVelocity || 0.0,
					lastLoginDate: userState.lastLoginDate || null,
					currentStreak: userState.currentStreak || 0,
					maxStreak: userState.maxStreak || 0,
					streakUpdatedAt: userState.streakUpdatedAt || null,
					stateHistory: userState.stateHistory || [],
				},
				{ transaction: t }
			);

			await this.updateStreak(stateNew);

			stateNew.stateHistory.push({
				timestamp: new Date(),
				state: stateNew.toJSON(),
			});
			await stateNew.save({ transaction: t });
			if (shouldCommit) {
				await t.commit();
			}

			return { userId, userState: stateNew.toJSON() };
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(
				`Failed to update user state: ${err.message}`
			);
		}
	}

	async leaderboard(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			// Get user data and position in the leaderboard
			let userRating = null;
			let userData = null;

			if (userId) {
				const userState = await UserState.findOne({
					where: { userId },
					include: User,
					attributes: [
						'state',
						'currentStreak',
						'maxStreak',
						'updatedAt',
						'userId',
					],
					transaction: t,
				});

				if (userState) {
					const userStars = userState.state?.totalStars || 0;
					const userUpdatedAt = userState.updatedAt;

					// Count users with more stars or same stars but more recent update
					const higherUsers = await UserState.count({
						where: {
							[Op.or]: [
								sequelize.literal(
									`(state->>'totalStars')::integer > ${userStars}`
								),
								{
									[Op.and]: [
										sequelize.literal(
											`(state->>'totalStars')::integer = ${userStars}`
										),
										{
											updatedAt: {
												[Op.gt]: userUpdatedAt,
											},
										},
									],
								},
							],
						},
						transaction: t,
					});

					userRating = higherUsers + 1;
					userData = userState.toJSON();
					userData.rating = userRating;
				}
			}

			// Get top users based on LEADERBOARD_LIMIT
			const topUsers = await UserState.findAll(
				{
					include: User,
					order: [
						[
							sequelize.literal(
								"(state->>'totalStars')::integer"
							),
							'DESC',
						],
						['updatedAt', 'DESC'],
					],
					limit: LEADERBOARD_LIMIT,
					attributes: [
						'state',
						'currentStreak',
						'maxStreak',
						'updatedAt',
						'userId',
					],
				},
				{ transaction: t }
			);

			// Calculate ratings for top users
			const users = topUsers.map((item, index) => {
				const user = item.toJSON();
				user.rating = index + 1;
				return user;
			});

			// Check if user is already in the leaderboard
			const userInLeaderboard =
				userId && users.some((user) => user.userId === userId);

			// Add user data to the end of the leaderboard if not already included
			if (userId && userData && !userInLeaderboard) {
				users.push(userData);
			}

			if (shouldCommit) {
				await t.commit();
			}
			return {
				leaderboard: users,
				userRating: userRating,
			};
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(
				`Failed to get leaderboard: ${err.message}`
			);
		}
	}

	async getUserResources(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userState) {
				if (shouldCommit) {
					await t.rollback();
				}
				throw ApiError.NotFound('User state not found');
			}

			// Extract resources from user state
			const resources = {
				stardust: userState.stardust || 0,
				darkMatter: userState.darkMatter || 0,
				tgStars: userState.tgStars || 0,
				stars: userState.stars || 0,
				tonToken: userState.tonToken || 0,
				lastDailyBonus: userState.lastDailyBonus || null,
				lockedResources: {
					stardust: userState.lockedStardust || 0,
					darkMatter: userState.lockedDarkMatter || 0,
					tgStars: userState.lockedTgStars || 0,
				},
			};

			if (shouldCommit) {
				await t.commit();
			}
			return resources;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to get user resources: ${err.message}`
			);
		}
	}

	async claimDailyBonus(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userState) {
				if (shouldCommit) {
					await t.rollback();
				}
				throw ApiError.NotFound('User state not found');
			}

			const now = new Date();
			const today = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate()
			);

			// Check if bonus was already claimed today
			if (userState.lastDailyBonus) {
				const lastClaim = new Date(userState.lastDailyBonus);
				const lastClaimDate = new Date(
					lastClaim.getFullYear(),
					lastClaim.getMonth(),
					lastClaim.getDate()
				);

				if (lastClaimDate.getTime() === today.getTime()) {
					if (shouldCommit) {
						await t.rollback();
					}
					throw ApiError.BadRequest(
						'Daily bonus already claimed today'
					);
				}
			}

			// Calculate bonus based on streak
			const baseBonus = DAILY_BONUS_STARDUST; // Base stardust bonus
			const streakMultiplier = Math.min(userState.currentStreak || 1, 7); // Max 7x multiplier
			const bonusAmount = baseBonus * streakMultiplier;

			// Add bonus to user's stardust
			userState.stardust = (userState.stardust || 0) + bonusAmount;
			userState.lastDailyBonus = now;

			await userState.save({ transaction: t });

			if (shouldCommit) {
				await t.commit();
			}

			return {
				bonus: {
					stardust: bonusAmount,
					streakMultiplier: streakMultiplier,
					baseAmount: baseBonus,
				},
				newBalance: {
					stardust: userState.stardust,
					darkMatter: userState.darkMatter || 0,
					tgStars: userState.tgStars || 0,
				},
				nextClaimAvailable: new Date(
					today.getTime() + 24 * 60 * 60 * 1000
				), // Tomorrow
			};
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to claim daily bonus: ${err.message}`
			);
		}
	}

	async farming(userId, offers, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;
		const result = [];
		try {
			if (offers.length > 0) {
				for (const offer of offers) {
					const offerData = {
						sellerId: SYSTEM_USER_ID,
						buyerId: userId,
						price: offer.price,
						currency: offer.currency,
						itemId: 0,
						itemType: 'farming',
						amount: offer.amount,
						resource: offer.resource,
						offerType: 'SYSTEM',
						status: 'PENDING',
					};

					const {
						offerOut,
						marketTransaction,
						payment,
						transferStars,
					} = await marketService.registerFarmingReward(offerData);
					result.push({
						offerOut,
						marketTransaction,
						payment,
						transferStars,
					});
				}
			}

			if (shouldCommit) {
				await t.commit();
			}
			return {
				result,
			};
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			logger.error('Error in createSystemGalaxyWithOffer', err);
			throw ApiError.Internal(
				`Failed to create system galaxy with offer: ${err.message}`
			);
		}
	}
}

module.exports = new UserStateService();
