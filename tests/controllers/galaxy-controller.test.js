const galaxyController = require("../../controllers/galaxy-controller");
const galaxyService = require("../../service/galaxy-service");
const marketService = require("../../service/market-service");
const { Galaxy } = require("../../models/models");
const logger = require("../../service/logger-service");

// Мокаем сервисы и модели
jest.mock("../../service/galaxy-service");
jest.mock("../../service/market-service", () => ({
	registerGalaxyStarsTransfer: jest.fn(),
}));
jest.mock("../../models/models", () => ({
	Galaxy: {
		findOne: jest.fn(),
	},
}));
jest.mock("../../service/logger-service", () => ({
	info: jest.fn(),
	error: jest.fn(),
}));

describe("GalaxyController", () => {
	let req, res, next;

	beforeEach(() => {
		// Очищаем моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем моки для req, res и next
		req = {
			initdata: {
				id: 12345,
			},
			body: {},
			params: {},
		};

		res = {
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		};

		next = jest.fn();
	});

	describe("createUserGalaxy", () => {
		it("should create a galaxy and return it", async () => {
			// Mock данных
			const galaxyData = {
				seed: "testseed123",
				galaxyProperties: {
					type: "spiral",
					colorPalette: {
						insideColor: "#ff1493",
						outsideColor: "#00ffff",
					},
				},
			};

			const createdGalaxy = {
				id: 1,
				userId: req.initdata.id,
				...galaxyData,
			};

			req.body = galaxyData;
			galaxyService.createUserGalaxy.mockResolvedValue(createdGalaxy);

			// Вызываем тестируемый метод
			await galaxyController.createUserGalaxy(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.createUserGalaxy).toHaveBeenCalledWith(
				req.initdata.id,
				galaxyData
			);
			expect(logger.info).toHaveBeenCalledWith(
				"Galaxy created",
				expect.any(Object)
			);
			expect(res.json).toHaveBeenCalledWith(createdGalaxy);
			expect(next).not.toHaveBeenCalled();
		});

		it("should call next with error if service throws", async () => {
			// Mock ошибки
			const error = new Error("Failed to create galaxy");
			galaxyService.createUserGalaxy.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await galaxyController.createUserGalaxy(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.createUserGalaxy).toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("getUserGalaxies", () => {
		it("should return user galaxies", async () => {
			// Mock данных
			const galaxiesResponse = {
				galaxies: [
					{ id: 1, userId: req.initdata.id, seed: "seed1" },
					{ id: 2, userId: req.initdata.id, seed: "seed2" },
				],
				galaxiesThatGaveReward: ["seed1"],
			};

			galaxyService.getUserGalaxies.mockResolvedValue(galaxiesResponse);

			// Вызываем тестируемый метод
			await galaxyController.getUserGalaxies(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.getUserGalaxies).toHaveBeenCalledWith(
				req.initdata.id
			);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				data: {
					galaxies: galaxiesResponse.galaxies,
					galaxiesThatGaveReward: galaxiesResponse.galaxiesThatGaveReward,
				},
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("should call next with error if service throws", async () => {
			// Mock ошибки
			const error = new Error("Failed to get galaxies");
			galaxyService.getUserGalaxies.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await galaxyController.getUserGalaxies(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.getUserGalaxies).toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("addStarsToUserGalaxy", () => {
		it("should add stars to galaxy and return result", async () => {
			// Mock данных
			const galaxyId = 1;
			const amount = 100;

			req.body = { galaxyId, amount };

			const galaxy = {
				id: galaxyId,
				userId: req.initdata.id,
				starCurrent: 200,
			};

			const result = {
				galaxy: {
					...galaxy,
					starCurrent: 300, // Увеличенное значение после добавления звезд
				},
				transaction: {
					id: 1,
					amount,
				},
			};

			Galaxy.findOne.mockResolvedValue(galaxy);
			marketService.registerGalaxyStarsTransfer.mockResolvedValue(result);

			// Вызываем тестируемый метод
			await galaxyController.addStarsToUserGalaxy(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(Galaxy.findOne).toHaveBeenCalledWith({
				where: { id: galaxyId, userId: req.initdata.id },
			});

			expect(marketService.registerGalaxyStarsTransfer).toHaveBeenCalledWith({
				userId: req.initdata.id,
				galaxyId,
				amount,
				currency: "tgStars",
			});

			expect(logger.info).toHaveBeenCalledWith(
				"Stars added to galaxy",
				expect.any(Object)
			);

			expect(res.json).toHaveBeenCalledWith({
				success: true,
				galaxy: result.galaxy,
				transaction: result.transaction,
			});

			expect(next).not.toHaveBeenCalled();
		});

		it("should return 404 if galaxy not found or not owned by user", async () => {
			// Mock данных
			const galaxyId = 999;
			const amount = 100;

			req.body = { galaxyId, amount };
			Galaxy.findOne.mockResolvedValue(null);

			// Вызываем тестируемый метод
			await galaxyController.addStarsToUserGalaxy(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(Galaxy.findOne).toHaveBeenCalledWith({
				where: { id: galaxyId, userId: req.initdata.id },
			});

			expect(marketService.registerGalaxyStarsTransfer).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				error: "Galaxy not found or not owned by user",
			});

			expect(next).not.toHaveBeenCalled();
		});

		it("should call next with error if service throws", async () => {
			// Mock данных
			const galaxyId = 1;
			const amount = 100;

			req.body = { galaxyId, amount };

			const galaxy = {
				id: galaxyId,
				userId: req.initdata.id,
				starCurrent: 200,
			};

			const error = new Error("Failed to add stars");

			Galaxy.findOne.mockResolvedValue(galaxy);
			marketService.registerGalaxyStarsTransfer.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await galaxyController.addStarsToUserGalaxy(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(Galaxy.findOne).toHaveBeenCalled();
			expect(marketService.registerGalaxyStarsTransfer).toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("updateUserGalaxy", () => {
		it("should update a galaxy and return it", async () => {
			// Mock данных
			const galaxyData = {
				id: 1,
				seed: "testseed123",
				starCurrent: 500,
				price: 200,
				particleCount: 1500,
				onParticleCountChange: false,
			};

			const updatedGalaxy = {
				id: 1,
				userId: req.initdata.id,
				...galaxyData,
			};

			req.body = galaxyData;
			galaxyService.updateUserGalaxy.mockResolvedValue(updatedGalaxy);

			// Вызываем тестируемый метод
			await galaxyController.updateUserGalaxy(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.updateUserGalaxy).toHaveBeenCalledWith(
				req.initdata.id,
				galaxyData
			);
			expect(res.json).toHaveBeenCalledWith(updatedGalaxy);
			expect(next).not.toHaveBeenCalled();
		});

		it("should call next with error if service throws", async () => {
			// Mock ошибки
			const error = new Error("Failed to update galaxy");
			galaxyService.updateUserGalaxy.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await galaxyController.updateUserGalaxy(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.updateUserGalaxy).toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("createSystemGalaxyWithOffer", () => {
		it("should create a system galaxy with offer and return result", async () => {
			// Mock данных
			const galaxyData = {
				seed: "systemseed123",
				galaxyProperties: { type: "special" },
				particleCount: 2000,
			};

			const offerData = {
				price: 500,
				currency: "tgStars",
			};

			req.body = { galaxyData, offerData };

			const result = {
				galaxy: {
					id: 1,
					userId: 0, // system user
					seed: "systemseed123",
					galaxyProperties: { type: "special" },
				},
				offer: {
					id: "offer1",
					sellerId: 0,
					itemId: 1,
					price: 500,
					currency: "tgStars",
				},
			};

			galaxyService.createSystemGalaxyWithOffer.mockResolvedValue(result);

			// Вызываем тестируемый метод
			await galaxyController.createSystemGalaxyWithOffer(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.createSystemGalaxyWithOffer).toHaveBeenCalledWith(
				galaxyData,
				req.initdata.id,
				offerData
			);

			expect(logger.info).toHaveBeenCalledWith(
				"System galaxy with offer created",
				expect.any(Object)
			);

			expect(res.json).toHaveBeenCalledWith(result);
			expect(next).not.toHaveBeenCalled();
		});

		it("should return 400 if required data is missing", async () => {
			// Mock данных - отсутствует galaxyData
			req.body = { offerData: { price: 500, currency: "tgStars" } };

			// Вызываем тестируемый метод
			await galaxyController.createSystemGalaxyWithOffer(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.createSystemGalaxyWithOffer).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "Missing required data: galaxyData and offerData",
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("should return 400 if galaxy data is invalid", async () => {
			// Mock данных - отсутствует seed и galaxyProperties
			req.body = {
				galaxyData: { particleCount: 2000 },
				offerData: { price: 500, currency: "tgStars" },
			};

			// Вызываем тестируемый метод
			await galaxyController.createSystemGalaxyWithOffer(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.createSystemGalaxyWithOffer).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "Invalid galaxy data: seed and galaxyProperties are required",
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("should return 400 if offer data is invalid", async () => {
			// Mock данных - отсутствует price и currency
			req.body = {
				galaxyData: {
					seed: "systemseed123",
					galaxyProperties: { type: "special" },
				},
				offerData: {},
			};

			// Вызываем тестируемый метод
			await galaxyController.createSystemGalaxyWithOffer(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.createSystemGalaxyWithOffer).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "Invalid offer data: price and currency are required",
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("should call next with error if service throws", async () => {
			// Mock данных
			const galaxyData = {
				seed: "systemseed123",
				galaxyProperties: { type: "special" },
			};

			const offerData = {
				price: 500,
				currency: "tgStars",
			};

			req.body = { galaxyData, offerData };

			const error = new Error("Failed to create system galaxy");
			galaxyService.createSystemGalaxyWithOffer.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await galaxyController.createSystemGalaxyWithOffer(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(galaxyService.createSystemGalaxyWithOffer).toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
