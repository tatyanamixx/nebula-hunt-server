# Тестирование

## Обзор

Тестирование Nebulahant Server включает различные уровни проверки функциональности, от unit тестов отдельных компонентов до end-to-end тестирования полного пользовательского сценария.

## Стратегия тестирования

### Пирамида тестирования

```
    E2E Tests (10%)
   ┌─────────────┐
   │             │
   │ Integration │ (20%)
   │    Tests    │
   └─────────────┘
   ┌─────────────┐
   │             │
   │  Unit Tests │ (70%)
   │             │
   └─────────────┘
```

### Принципы тестирования

1. **Покрытие кода** - минимум 80% покрытия
2. **Изоляция тестов** - каждый тест независим
3. **Детерминированность** - тесты дают одинаковый результат
4. **Быстрота выполнения** - тесты выполняются быстро
5. **Читаемость** - тесты легко понять и поддерживать

## Unit тесты

### Настройка тестового окружения

```javascript
// jest.config.js
module.exports = {
	testEnvironment: 'node',
	collectCoverageFrom: [
		'service/**/*.js',
		'controllers/**/*.js',
		'middlewares/**/*.js',
		'!**/node_modules/**',
		'!**/coverage/**',
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
	testMatch: ['**/tests/**/*.test.js'],
	verbose: true,
};
```

### Настройка тестов

```javascript
// tests/setup.js
const { sequelize } = require('../db');

beforeAll(async () => {
	// Подключение к тестовой базе данных
	await sequelize.authenticate();
});

beforeEach(async () => {
	// Очистка базы данных перед каждым тестом
	await sequelize.truncate({ cascade: true });
});

afterAll(async () => {
	// Закрытие соединения с базой данных
	await sequelize.close();
});
```

### Тестирование сервисов

#### UserService тесты

```javascript
// tests/service/user-service.test.js
const userService = require('../../service/user-service');
const { User, UserState, Galaxy } = require('../../models/models');
const ApiError = require('../../exceptions/api-error');

describe('UserService', () => {
	describe('registration', () => {
		it('should create new user successfully', async () => {
			// Arrange
			const userData = {
				id: 123456,
				username: 'testuser',
				referral: 0,
				userState: {
					state: {
						totalStars: 100,
						stardustCount: 0,
						darkMatterCount: 0,
						ownedGalaxiesCount: 1,
						ownedNodesCount: 0,
					},
				},
				galaxies: [
					{
						starMin: 100,
						starCurrent: 100,
						seed: 'test_seed',
						particleCount: 100,
					},
				],
			};

			// Act
			const result = await userService.registration(
				userData.id,
				userData.username,
				userData.referral,
				userData.userState,
				userData.galaxies
			);

			// Assert
			expect(result.user).toBeDefined();
			expect(result.user.id).toBe(userData.id);
			expect(result.user.username).toBe(userData.username);
			expect(result.userState).toBeDefined();
			expect(result.userGalaxies).toHaveLength(1);
			expect(result.accessToken).toBeDefined();
			expect(result.refreshToken).toBeDefined();
		});

		it('should create system user on first registration', async () => {
			// Arrange
			const userData = {
				id: 123456,
				username: 'firstuser',
				referral: 0,
				userState: { state: { totalStars: 100 } },
				galaxies: [],
			};

			// Act
			await userService.registration(
				userData.id,
				userData.username,
				userData.referral,
				userData.userState,
				userData.galaxies
			);

			// Assert
			const systemUser = await User.findByPk(-1);
			expect(systemUser).toBeDefined();
			expect(systemUser.role).toBe('SYSTEM');
			expect(systemUser.username).toBe('SYSTEM');
		});

		it('should throw error for duplicate user', async () => {
			// Arrange
			const userData = {
				id: 123456,
				username: 'testuser',
				referral: 0,
				userState: { state: { totalStars: 100 } },
				galaxies: [],
			};

			// Создаем пользователя
			await userService.registration(
				userData.id,
				userData.username,
				userData.referral,
				userData.userState,
				userData.galaxies
			);

			// Act & Assert
			await expect(
				userService.registration(
					userData.id,
					userData.username,
					userData.referral,
					userData.userState,
					userData.galaxies
				)
			).rejects.toThrow(ApiError.BadRequest);
		});
	});

	describe('login', () => {
		it('should login existing user successfully', async () => {
			// Arrange
			const userId = 123456;
			await User.create({
				id: userId,
				username: 'testuser',
				role: 'USER',
				blocked: false,
			});

			// Act
			const result = await userService.login(userId);

			// Assert
			expect(result.user).toBeDefined();
			expect(result.user.id).toBe(userId);
			expect(result.accessToken).toBeDefined();
			expect(result.refreshToken).toBeDefined();
		});

		it('should throw error for non-existent user', async () => {
			// Act & Assert
			await expect(userService.login(999999)).rejects.toThrow(
				ApiError.BadRequest
			);
		});

		it('should throw error for blocked user', async () => {
			// Arrange
			const userId = 123456;
			await User.create({
				id: userId,
				username: 'blockeduser',
				role: 'USER',
				blocked: true,
			});

			// Act & Assert
			await expect(userService.login(userId)).rejects.toThrow(
				ApiError.BadRequest
			);
		});
	});

	describe('getFriends', () => {
		it('should return user friends', async () => {
			// Arrange
			const mainUserId = 123456;
			const friendUserId = 789012;

			await User.create({
				id: mainUserId,
				username: 'mainuser',
				referral: 0,
			});

			await User.create({
				id: friendUserId,
				username: 'frienduser',
				referral: mainUserId,
			});

			// Act
			const friends = await userService.getFriends(mainUserId);

			// Assert
			expect(friends).toHaveLength(1);
			expect(friends[0].id).toBe(friendUserId);
			expect(friends[0].referral).toBe(mainUserId);
		});
	});
});
```

#### StateService тесты

```javascript
// tests/service/state-service.test.js
const stateService = require('../../service/state-service');
const { User, UserState } = require('../../models/models');

describe('StateService', () => {
	describe('createUserState', () => {
		it('should create user state successfully', async () => {
			// Arrange
			const userId = 123456;
			const userStateData = {
				state: {
					totalStars: 100,
					stardustCount: 0,
					darkMatterCount: 0,
					ownedGalaxiesCount: 1,
					ownedNodesCount: 0,
				},
			};

			// Act
			const result = await stateService.createUserState(
				userId,
				userStateData
			);

			// Assert
			expect(result.userId).toBe(userId);
			expect(result.state.totalStars).toBe(100);
			expect(result.chaosLevel).toBe(0.0);
			expect(result.stabilityLevel).toBe(0.0);
		});
	});

	describe('updateUserState', () => {
		it('should update user state successfully', async () => {
			// Arrange
			const userId = 123456;
			const userState = await stateService.createUserState(userId, {
				state: { totalStars: 100 },
			});

			const updates = {
				state: { totalStars: 200 },
				chaosLevel: 0.3,
			};

			// Act
			const result = await stateService.updateUserState(userId, updates);

			// Assert
			expect(result.state.totalStars).toBe(200);
			expect(result.chaosLevel).toBe(0.3);
		});
	});
});
```

#### GalaxyService тесты

```javascript
// tests/service/galaxy-service.test.js
const galaxyService = require('../../service/galaxy-service');
const { User, Galaxy } = require('../../models/models');

describe('GalaxyService', () => {
	describe('createGalaxy', () => {
		it('should create galaxy successfully', async () => {
			// Arrange
			const userId = 123456;
			const galaxyData = {
				starMin: 100,
				starCurrent: 100,
				seed: 'test_seed',
				particleCount: 100,
			};

			// Act
			const result = await galaxyService.createGalaxy(userId, galaxyData);

			// Assert
			expect(result.userId).toBe(userId);
			expect(result.starMin).toBe(100);
			expect(result.starCurrent).toBe(100);
			expect(result.seed).toBe('test_seed');
			expect(result.active).toBe(true);
		});

		it('should generate unique seed if not provided', async () => {
			// Arrange
			const userId = 123456;
			const galaxyData = {
				starMin: 100,
				starCurrent: 100,
				particleCount: 100,
			};

			// Act
			const result = await galaxyService.createGalaxy(userId, galaxyData);

			// Assert
			expect(result.seed).toBeDefined();
			expect(result.seed.length).toBeGreaterThan(0);
		});
	});

	describe('getUserGalaxies', () => {
		it('should return user galaxies', async () => {
			// Arrange
			const userId = 123456;
			await galaxyService.createGalaxy(userId, {
				starMin: 100,
				starCurrent: 100,
				seed: 'galaxy1',
			});

			await galaxyService.createGalaxy(userId, {
				starMin: 200,
				starCurrent: 200,
				seed: 'galaxy2',
			});

			// Act
			const galaxies = await galaxyService.getUserGalaxies(userId);

			// Assert
			expect(galaxies).toHaveLength(2);
			expect(galaxies[0].userId).toBe(userId);
			expect(galaxies[1].userId).toBe(userId);
		});
	});
});
```

### Тестирование контроллеров

```javascript
// tests/controllers/user-controller.test.js
const request = require('supertest');
const app = require('../../index');
const { User, UserState } = require('../../models/models');

describe('UserController', () => {
	describe('POST /api/auth/registration', () => {
		it('should register new user', async () => {
			// Arrange
			const userData = {
				referral: 0,
				userState: {
					state: {
						totalStars: 100,
						stardustCount: 0,
						darkMatterCount: 0,
						ownedGalaxiesCount: 1,
						ownedNodesCount: 0,
					},
				},
				galaxies: [
					{
						starMin: 100,
						starCurrent: 100,
						seed: 'test_seed',
						particleCount: 100,
					},
				],
			};

			// Act
			const response = await request(app)
				.post('/api/auth/registration')
				.set('x-telegram-init-data', 'mock-telegram-data')
				.send(userData);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.user).toBeDefined();
			expect(response.body.accessToken).toBeDefined();
			expect(response.body.refreshToken).toBeDefined();
		});

		it('should return 400 for invalid data', async () => {
			// Arrange
			const invalidData = {
				referral: 'invalid',
				userState: {},
			};

			// Act
			const response = await request(app)
				.post('/api/auth/registration')
				.set('x-telegram-init-data', 'mock-telegram-data')
				.send(invalidData);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});

	describe('POST /api/auth/login', () => {
		it('should login existing user', async () => {
			// Arrange
			const userId = 123456;
			await User.create({
				id: userId,
				username: 'testuser',
				role: 'USER',
				blocked: false,
			});

			// Act
			const response = await request(app)
				.post('/api/auth/login')
				.set('x-telegram-init-data', 'mock-telegram-data')
				.send({});

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.user).toBeDefined();
			expect(response.body.accessToken).toBeDefined();
		});
	});
});
```

### Тестирование middleware

```javascript
// tests/middlewares/tma-middleware.test.js
const tmaMiddleware = require('../../middlewares/tma-middleware');
const ApiError = require('../../exceptions/api-error');

describe('TMAMiddleware', () => {
	it('should validate valid telegram data', async () => {
		// Arrange
		const req = {
			headers: {
				'x-telegram-init-data': 'valid-telegram-data',
			},
		};
		const res = {};
		const next = jest.fn();

		// Mock validate function
		jest.mock('@telegram-apps/init-data-node', () => ({
			validate: jest.fn().mockReturnValue({
				id: 123456,
				username: 'testuser',
			}),
		}));

		// Act
		await tmaMiddleware(req, res, next);

		// Assert
		expect(next).toHaveBeenCalled();
		expect(req.initdata).toBeDefined();
		expect(req.initdata.id).toBe(123456);
	});

	it('should throw error for missing telegram data', async () => {
		// Arrange
		const req = { headers: {} };
		const res = {};
		const next = jest.fn();

		// Act
		await tmaMiddleware(req, res, next);

		// Assert
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 401,
				message: 'Telegram init data required',
			})
		);
	});
});
```

## Integration тесты

### Настройка тестовой базы данных

```javascript
// tests/integration/setup.js
const { sequelize } = require('../../db');

beforeAll(async () => {
	// Создание тестовой базы данных
	await sequelize.createSchema('test');
	await sequelize.sync({ force: true });
});

afterAll(async () => {
	// Удаление тестовой схемы
	await sequelize.dropSchema('test');
	await sequelize.close();
});
```

### API Integration тесты

```javascript
// tests/integration/api.test.js
const request = require('supertest');
const app = require('../../index');
const { User, UserState, Galaxy } = require('../../models/models');

describe('API Integration Tests', () => {
	let authToken;
	let userId;

	beforeAll(async () => {
		// Создание тестового пользователя
		const user = await User.create({
			id: 123456,
			username: 'testuser',
			role: 'USER',
			blocked: false,
		});
		userId = user.id;

		// Получение токена аутентификации
		const loginResponse = await request(app)
			.post('/api/auth/login')
			.set('x-telegram-init-data', 'mock-telegram-data')
			.send({});

		authToken = loginResponse.body.accessToken;
	});

	describe('Galaxy API', () => {
		it('should create and retrieve galaxies', async () => {
			// Arrange
			const galaxyData = {
				starMin: 100,
				starCurrent: 100,
				seed: 'test_galaxy',
				particleCount: 100,
			};

			// Act - создание галактики
			const createResponse = await request(app)
				.post('/api/galaxy')
				.set('Authorization', `Bearer ${authToken}`)
				.send(galaxyData);

			expect(createResponse.status).toBe(200);
			expect(createResponse.body.id).toBeDefined();

			// Act - получение галактик
			const getResponse = await request(app)
				.get('/api/galaxy')
				.set('Authorization', `Bearer ${authToken}`);

			// Assert
			expect(getResponse.status).toBe(200);
			expect(getResponse.body).toHaveLength(1);
			expect(getResponse.body[0].seed).toBe('test_galaxy');
		});
	});

	describe('State API', () => {
		it('should update and retrieve user state', async () => {
			// Arrange
			const stateUpdate = {
				state: {
					totalStars: 1000,
					stardustCount: 150,
				},
				chaosLevel: 0.3,
			};

			// Act - обновление состояния
			const updateResponse = await request(app)
				.put('/api/state')
				.set('Authorization', `Bearer ${authToken}`)
				.send(stateUpdate);

			expect(updateResponse.status).toBe(200);

			// Act - получение состояния
			const getResponse = await request(app)
				.get('/api/state')
				.set('Authorization', `Bearer ${authToken}`);

			// Assert
			expect(getResponse.status).toBe(200);
			expect(getResponse.body.state.totalStars).toBe(1000);
			expect(getResponse.body.state.stardustCount).toBe(150);
			expect(getResponse.body.chaosLevel).toBe(0.3);
		});
	});
});
```

## End-to-End тесты

### Настройка E2E тестов

```javascript
// tests/e2e/setup.js
const puppeteer = require('puppeteer');

let browser;
let page;

beforeAll(async () => {
	browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});
});

beforeEach(async () => {
	page = await browser.newPage();
	await page.goto('http://localhost:3000');
});

afterEach(async () => {
	await page.close();
});

afterAll(async () => {
	await browser.close();
});
```

### E2E тесты пользовательского сценария

```javascript
// tests/e2e/user-journey.test.js
describe('User Journey', () => {
	it('should complete full user registration and gameplay', async () => {
		// Шаг 1: Регистрация пользователя
		await page.click('#register-button');
		await page.waitForSelector('#registration-form');

		await page.type('#username', 'testuser');
		await page.click('#submit-registration');

		await page.waitForSelector('#game-interface');

		// Шаг 2: Создание первой галактики
		await page.click('#create-galaxy');
		await page.waitForSelector('#galaxy-created');

		// Проверка, что галактика появилась
		const galaxyCount = await page.$$eval(
			'.galaxy-item',
			(items) => items.length
		);
		expect(galaxyCount).toBe(1);

		// Шаг 3: Покупка первого апгрейда
		await page.click('#upgrades-tab');
		await page.waitForSelector('.upgrade-item');

		const firstUpgrade = await page.$('.upgrade-item');
		await firstUpgrade.click();

		await page.waitForSelector('#upgrade-purchased');

		// Шаг 4: Проверка увеличения производства
		await page.click('#galaxies-tab');
		await page.waitForTimeout(5000); // ждем 5 секунд

		const starsBefore = await page.$eval('#total-stars', (el) =>
			parseInt(el.textContent)
		);
		expect(starsBefore).toBeGreaterThan(100);

		// Шаг 5: Выполнение задачи
		await page.click('#tasks-tab');
		await page.waitForSelector('.task-item');

		const firstTask = await page.$('.task-item');
		await firstTask.click();

		await page.waitForSelector('#task-completed');

		// Проверка награды
		const stardustCount = await page.$eval('#stardust-count', (el) =>
			parseInt(el.textContent)
		);
		expect(stardustCount).toBeGreaterThan(0);
	});
});
```

## Performance тесты

### Нагрузочное тестирование

```javascript
// tests/performance/load.test.js
const autocannon = require('autocannon');

describe('Performance Tests', () => {
	it('should handle concurrent requests', async () => {
		const result = await autocannon({
			url: 'http://localhost:5000/api/auth/login',
			connections: 10,
			duration: 10,
			headers: {
				'x-telegram-init-data': 'mock-telegram-data',
			},
			method: 'POST',
			body: JSON.stringify({}),
		});

		expect(result.errors).toBe(0);
		expect(result.timeouts).toBe(0);
		expect(result.latency.p99).toBeLessThan(1000); // 99% запросов должны выполняться менее 1 секунды
	});

	it('should handle database load', async () => {
		const result = await autocannon({
			url: 'http://localhost:5000/api/state',
			connections: 50,
			duration: 30,
			headers: {
				Authorization: 'Bearer test-token',
			},
		});

		expect(result.errors).toBe(0);
		expect(result.throughput.average).toBeGreaterThan(100); // минимум 100 запросов в секунду
	});
});
```

### Стресс-тестирование

```javascript
// tests/performance/stress.test.js
const loadtest = require('loadtest');

describe('Stress Tests', () => {
	it('should handle high load', async () => {
		const options = {
			url: 'http://localhost:5000/api/galaxy',
			maxRequests: 1000,
			concurrency: 100,
			method: 'GET',
			headers: {
				Authorization: 'Bearer test-token',
			},
		};

		return new Promise((resolve, reject) => {
			loadtest.loadTest(options, (error, result) => {
				if (error) {
					reject(error);
				} else {
					expect(result.totalRequests).toBe(1000);
					expect(result.totalErrors).toBe(0);
					expect(result.rps).toBeGreaterThan(50); // минимум 50 запросов в секунду
					resolve();
				}
			});
		});
	});
});
```

## Тестирование безопасности

### Тесты аутентификации

```javascript
// tests/security/auth.test.js
const request = require('supertest');
const app = require('../../index');

describe('Security Tests', () => {
	describe('Authentication', () => {
		it('should reject requests without telegram data', async () => {
			const response = await request(app)
				.post('/api/auth/login')
				.send({});

			expect(response.status).toBe(401);
		});

		it('should reject invalid JWT tokens', async () => {
			const response = await request(app)
				.get('/api/state')
				.set('Authorization', 'Bearer invalid-token');

			expect(response.status).toBe(401);
		});

		it('should reject expired tokens', async () => {
			// Создание истекшего токена
			const expiredToken = createExpiredToken();

			const response = await request(app)
				.get('/api/state')
				.set('Authorization', `Bearer ${expiredToken}`);

			expect(response.status).toBe(401);
		});
	});

	describe('Authorization', () => {
		it('should reject non-admin access to admin endpoints', async () => {
			const userToken = await createUserToken();

			const response = await request(app)
				.get('/api/admin/users')
				.set('Authorization', `Bearer ${userToken}`);

			expect(response.status).toBe(403);
		});
	});

	describe('Input Validation', () => {
		it('should reject SQL injection attempts', async () => {
			const response = await request(app)
				.post('/api/auth/registration')
				.set('x-telegram-init-data', 'mock-data')
				.send({
					referral: "'; DROP TABLE users; --",
				});

			expect(response.status).toBe(400);
		});

		it('should reject XSS attempts', async () => {
			const response = await request(app)
				.post('/api/auth/registration')
				.set('x-telegram-init-data', 'mock-data')
				.send({
					username: '<script>alert("xss")</script>',
				});

			expect(response.status).toBe(400);
		});
	});
});
```

## Покрытие кода

### Настройка покрытия

```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:integration": "jest --config jest.integration.config.js",
    "test:e2e": "jest --config jest.e2e.config.js"
  }
}
```

### Отчет о покрытии

```bash
# Запуск тестов с покрытием
npm run test:coverage

# Просмотр отчета
open coverage/lcov-report/index.html
```

### Целевые показатели покрытия

-   **Сервисы**: 90%+
-   **Контроллеры**: 85%+
-   **Middleware**: 80%+
-   **Модели**: 70%+
-   **Общее покрытие**: 80%+

## Автоматизация тестирования

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
    test:
        runs-on: ubuntu-latest

        services:
            postgres:
                image: postgres:15
                env:
                    POSTGRES_PASSWORD: postgres
                    POSTGRES_DB: nebulahant_test
                options: >-
                    --health-cmd pg_isready
                    --health-interval 10s
                    --health-timeout 5s
                    --health-retries 5
                ports:
                    - 5432:5432

        steps:
            - uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: '18'
                  cache: 'npm'

            - name: Install dependencies
              run: npm ci

            - name: Run unit tests
              run: npm run test:coverage
              env:
                  DB_HOST: localhost
                  DB_PORT: 5432
                  DB_NAME: nebulahant_test
                  DB_USER: postgres
                  DB_PASSWORD: postgres

            - name: Run integration tests
              run: npm run test:integration
              env:
                  DB_HOST: localhost
                  DB_PORT: 5432
                  DB_NAME: nebulahant_test
                  DB_USER: postgres
                  DB_PASSWORD: postgres

            - name: Upload coverage
              uses: codecov/codecov-action@v3
              with:
                  file: ./coverage/lcov.info
```

### Pre-commit hooks

```json
// package.json
{
	"husky": {
		"hooks": {
			"pre-commit": "npm run test && npm run lint",
			"pre-push": "npm run test:coverage"
		}
	}
}
```

## Мониторинг тестов

### Метрики качества

```javascript
// tests/metrics/quality-metrics.js
const fs = require('fs');
const path = require('path');

function generateQualityReport() {
	const coverage = JSON.parse(
		fs.readFileSync('coverage/coverage-summary.json')
	);
	const testResults = JSON.parse(fs.readFileSync('test-results.json'));

	const report = {
		timestamp: new Date().toISOString(),
		coverage: {
			total: coverage.total.lines.pct,
			services: coverage.service.lines.pct,
			controllers: coverage.controllers.lines.pct,
		},
		tests: {
			total: testResults.numTotalTests,
			passed: testResults.numPassedTests,
			failed: testResults.numFailedTests,
			duration: testResults.testResults.reduce(
				(sum, result) => sum + result.duration,
				0
			),
		},
		quality: {
			score: calculateQualityScore(coverage, testResults),
			recommendations: generateRecommendations(coverage, testResults),
		},
	};

	fs.writeFileSync('quality-report.json', JSON.stringify(report, null, 2));
	return report;
}

function calculateQualityScore(coverage, testResults) {
	const coverageScore = coverage.total.lines.pct;
	const testScore =
		(testResults.numPassedTests / testResults.numTotalTests) * 100;

	return (coverageScore + testScore) / 2;
}
```

---

Эта документация обеспечивает полное покрытие тестирования Nebulahant Server, от unit тестов до end-to-end сценариев, гарантируя качество и надежность системы.
