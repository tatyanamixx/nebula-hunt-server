const artifactController = require('../../controllers/artifact-controller');
const artifactService = require('../../service/artifact-service');

// Мокаем сервис артифактов
jest.mock('../../service/artifact-service', () => ({
	addArtifactToUser: jest.fn(),
	getUserArtifacts: jest.fn(),
	createSystemArtifactWithOffer: jest.fn(),
}));

describe('ArtifactController', () => {
	let req;
	let res;

	beforeEach(() => {
		// Сбрасываем моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем моки для req и res
		req = {
			body: {},
			initdata: {
				id: 1,
			},
		};

		res = {
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		};
	});

	describe('addArtifactToUser', () => {
		it('should add artifact to user and return it', async () => {
			// Подготавливаем тестовые данные
			const artifactData = {
				seed: 'artifact-seed-123',
				name: 'Ancient Relic',
				description: 'A mysterious artifact from ancient times',
				rarity: 'LEGENDARY',
				image: 'artifact.jpg',
				effects: { power: 100, luck: 50 },
				tradable: true,
			};

			const mockArtifact = {
				id: 1,
				userId: req.initdata.id,
				...artifactData,
			};

			// Устанавливаем входные данные запроса
			req.body = artifactData;

			// Устанавливаем мок для сервиса
			artifactService.addArtifactToUser.mockResolvedValue(mockArtifact);

			// Вызываем тестируемый метод
			await artifactController.addArtifactToUser(req, res);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(artifactService.addArtifactToUser).toHaveBeenCalledWith({
				userId: req.initdata.id,
				...artifactData,
			});

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockArtifact);
		});

		it('should handle errors and return 400 status', async () => {
			// Устанавливаем мок для сервиса, который выбрасывает ошибку
			const errorMessage = 'Failed to add artifact';
			artifactService.addArtifactToUser.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем тестируемый метод
			await artifactController.addArtifactToUser(req, res);

			// Проверяем, что был установлен правильный статус и сообщение об ошибке
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
		});
	});

	describe('getUserArtifacts', () => {
		it('should return user artifacts', async () => {
			// Подготавливаем тестовые данные
			const mockArtifacts = [
				{
					id: 1,
					userId: req.initdata.id,
					seed: 'artifact-seed-123',
					name: 'Ancient Relic',
					rarity: 'LEGENDARY',
				},
				{
					id: 2,
					userId: req.initdata.id,
					seed: 'artifact-seed-456',
					name: 'Magic Crystal',
					rarity: 'RARE',
				},
			];

			// Устанавливаем мок для сервиса
			artifactService.getUserArtifacts.mockResolvedValue(mockArtifacts);

			// Вызываем тестируемый метод
			await artifactController.getUserArtifacts(req, res);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(artifactService.getUserArtifacts).toHaveBeenCalledWith(
				req.initdata.id
			);

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockArtifacts);
		});

		it('should handle errors and return 500 status', async () => {
			// Устанавливаем мок для сервиса, который выбрасывает ошибку
			const errorMessage = 'Failed to get artifacts';
			artifactService.getUserArtifacts.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем тестируемый метод
			await artifactController.getUserArtifacts(req, res);

			// Проверяем, что был установлен правильный статус и сообщение об ошибке
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
		});
	});

	describe('createSystemArtifactWithOffer', () => {
		it('should create system artifact with offer and return result', async () => {
			// Подготавливаем тестовые данные
			const artifactData = {
				seed: 'system-artifact-seed',
				name: 'System Artifact',
				description: 'Special artifact from the system',
				rarity: 'MYTHICAL',
				image: 'system-artifact.jpg',
				effects: { special: 200 },
			};

			const offerData = {
				price: 1000,
				currency: 'tgStars',
				expiresAt: new Date(Date.now() + 86400000), // 1 day from now
			};

			const mockResult = {
				artifact: { id: 10, ...artifactData },
				offer: { id: 20, price: offerData.price },
				transaction: { id: 30 },
				payment: { id: 40 },
			};

			// Устанавливаем входные данные запроса
			req.body = { artifactData, offerData };

			// Устанавливаем мок для сервиса
			artifactService.createSystemArtifactWithOffer.mockResolvedValue(
				mockResult
			);

			// Вызываем тестируемый метод
			await artifactController.createSystemArtifactWithOffer(req, res);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(
				artifactService.createSystemArtifactWithOffer
			).toHaveBeenCalledWith(artifactData, req.initdata.id, offerData);

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockResult);
		});

		it('should return 400 if artifactData or offerData is missing', async () => {
			// Устанавливаем входные данные запроса без artifactData
			req.body = { offerData: { price: 1000, currency: 'tgStars' } };

			// Вызываем тестируемый метод
			await artifactController.createSystemArtifactWithOffer(req, res);

			// Проверяем, что был установлен правильный статус и сообщение об ошибке
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: 'Missing required data: artifactData and offerData',
			});

			// Сервис не должен быть вызван
			expect(
				artifactService.createSystemArtifactWithOffer
			).not.toHaveBeenCalled();
		});

		it('should return 400 if artifact data is invalid', async () => {
			// Устанавливаем входные данные запроса с неполными данными артефакта
			req.body = {
				artifactData: { seed: 'seed1' }, // Отсутствуют name и rarity
				offerData: { price: 1000, currency: 'tgStars' },
			};

			// Вызываем тестируемый метод
			await artifactController.createSystemArtifactWithOffer(req, res);

			// Проверяем, что был установлен правильный статус и сообщение об ошибке
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: 'Invalid artifact data: seed, name and rarity are required',
			});

			// Сервис не должен быть вызван
			expect(
				artifactService.createSystemArtifactWithOffer
			).not.toHaveBeenCalled();
		});

		it('should return 400 if offer data is invalid', async () => {
			// Устанавливаем входные данные запроса с неполными данными оферты
			req.body = {
				artifactData: {
					seed: 'seed1',
					name: 'Test Artifact',
					rarity: 'COMMON',
				},
				offerData: { price: 1000 }, // Отсутствует currency
			};

			// Вызываем тестируемый метод
			await artifactController.createSystemArtifactWithOffer(req, res);

			// Проверяем, что был установлен правильный статус и сообщение об ошибке
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: 'Invalid offer data: price and currency are required',
			});

			// Сервис не должен быть вызван
			expect(
				artifactService.createSystemArtifactWithOffer
			).not.toHaveBeenCalled();
		});

		it('should handle service errors and return 400 status', async () => {
			// Подготавливаем полные данные запроса
			req.body = {
				artifactData: {
					seed: 'seed1',
					name: 'Test Artifact',
					rarity: 'COMMON',
				},
				offerData: {
					price: 1000,
					currency: 'tgStars',
				},
			};

			// Устанавливаем мок для сервиса, который выбрасывает ошибку
			const errorMessage = 'Failed to create artifact offer';
			artifactService.createSystemArtifactWithOffer.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем тестируемый метод
			await artifactController.createSystemArtifactWithOffer(req, res);

			// Проверяем, что был установлен правильный статус и сообщение об ошибке
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
		});
	});
});
