/**
 * Password Service Tests
 * created by Claude on 26.07.2025
 */
const passwordService = require('../../service/password-service');
const { Admin } = require('../../models/models');

describe('PasswordService', () => {
	let testAdmin;

	beforeEach(async () => {
		// Создаем тестового админа
		testAdmin = await Admin.create({
			email: 'test@example.com',
			name: 'Test Admin',
			role: 'ADMIN',
		});
	});

	afterEach(async () => {
		// Очищаем тестовые данные
		if (testAdmin) {
			await testAdmin.destroy();
		}
	});

	describe('validatePassword', () => {
		test('should validate strong password', () => {
			const result = passwordService.validatePassword('SecurePass123!');
			expect(result.isValid).toBe(true);
		});

		test('should reject short password', () => {
			const result = passwordService.validatePassword('Short1!');
			expect(result.isValid).toBe(false);
			expect(result.error).toContain('минимум');
		});

		test('should reject password without numbers', () => {
			const result = passwordService.validatePassword('SecurePass!');
			expect(result.isValid).toBe(false);
			expect(result.error).toContain('цифру');
		});

		test('should reject password without letters', () => {
			const result = passwordService.validatePassword('12345678!');
			expect(result.isValid).toBe(false);
			expect(result.error).toContain('букву');
		});

		test('should reject password without special characters', () => {
			const result = passwordService.validatePassword('SecurePass123');
			expect(result.isValid).toBe(false);
			expect(result.error).toContain('специальный символ');
		});
	});

	describe('hashPassword and comparePassword', () => {
		test('should hash and compare password correctly', async () => {
			const password = 'SecurePass123!';
			const hashedPassword = await passwordService.hashPassword(password);

			expect(hashedPassword).not.toBe(password);
			expect(hashedPassword).toHaveLength(60); // bcrypt hash length

			const isValid = await passwordService.comparePassword(
				password,
				hashedPassword
			);
			expect(isValid).toBe(true);
		});

		test('should reject wrong password', async () => {
			const password = 'SecurePass123!';
			const hashedPassword = await passwordService.hashPassword(password);

			const isValid = await passwordService.comparePassword(
				'WrongPass123!',
				hashedPassword
			);
			expect(isValid).toBe(false);
		});
	});

	describe('setPasswordWithExpiry', () => {
		test('should set password with expiry when ADMIN_PASSWORD_EXPIRY_DAYS is set', async () => {
			// Устанавливаем переменную окружения для теста
			process.env.ADMIN_PASSWORD_EXPIRY_DAYS = '90';

			const newPassword = 'NewSecurePass123!';
			const updatedAdmin = await passwordService.setPasswordWithExpiry(
				testAdmin,
				newPassword
			);

			expect(updatedAdmin.password).toBeDefined();
			expect(updatedAdmin.passwordChangedAt).toBeDefined();
			expect(updatedAdmin.passwordExpiresAt).toBeDefined();
			expect(updatedAdmin.loginAttempts).toBe(0);
			expect(updatedAdmin.lockedUntil).toBeNull();

			// Проверяем, что пароль хеширован
			const isValid = await passwordService.comparePassword(
				newPassword,
				updatedAdmin.password
			);
			expect(isValid).toBe(true);

			// Проверяем срок действия
			const expiryDate = new Date(updatedAdmin.passwordExpiresAt);
			const now = new Date();
			const daysDiff = Math.ceil(
				(expiryDate - now) / (1000 * 60 * 60 * 24)
			);
			expect(daysDiff).toBeGreaterThan(85); // Примерно 90 дней
			expect(daysDiff).toBeLessThan(95);
		});

		test('should set password without expiry when ADMIN_PASSWORD_EXPIRY_DAYS is not set', async () => {
			// Удаляем переменную окружения
			delete process.env.ADMIN_PASSWORD_EXPIRY_DAYS;

			const newPassword = 'NewSecurePass123!';
			const updatedAdmin = await passwordService.setPasswordWithExpiry(
				testAdmin,
				newPassword
			);

			expect(updatedAdmin.password).toBeDefined();
			expect(updatedAdmin.passwordChangedAt).toBeDefined();
			expect(updatedAdmin.passwordExpiresAt).toBeNull();
		});
	});

	describe('checkPasswordExpiry', () => {
		test('should return not expired for password without expiry', () => {
			testAdmin.passwordExpiresAt = null;
			const result = passwordService.checkPasswordExpiry(testAdmin);

			expect(result.isExpired).toBe(false);
			expect(result.daysLeft).toBeNull();
		});

		test('should return not expired for future expiry', () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 30);
			testAdmin.passwordExpiresAt = futureDate;

			const result = passwordService.checkPasswordExpiry(testAdmin);

			expect(result.isExpired).toBe(false);
			expect(result.daysLeft).toBeGreaterThan(25);
			expect(result.daysLeft).toBeLessThan(35);
		});

		test('should return expired for past expiry', () => {
			const pastDate = new Date();
			pastDate.setDate(pastDate.getDate() - 1);
			testAdmin.passwordExpiresAt = pastDate;

			const result = passwordService.checkPasswordExpiry(testAdmin);

			expect(result.isExpired).toBe(true);
			expect(result.daysLeft).toBe(0);
		});
	});

	describe('checkAccountLock', () => {
		test('should return not locked for account without lock', () => {
			testAdmin.lockedUntil = null;
			const result = passwordService.checkAccountLock(testAdmin);

			expect(result.isLocked).toBe(false);
		});

		test('should return locked for future lock', () => {
			const futureDate = new Date();
			futureDate.setMinutes(futureDate.getMinutes() + 30);
			testAdmin.lockedUntil = futureDate;

			const result = passwordService.checkAccountLock(testAdmin);

			expect(result.isLocked).toBe(true);
			expect(result.minutesLeft).toBeGreaterThan(25);
			expect(result.minutesLeft).toBeLessThan(35);
		});

		test('should auto-unlock expired lock', async () => {
			const pastDate = new Date();
			pastDate.setMinutes(pastDate.getMinutes() - 1);
			testAdmin.lockedUntil = pastDate;
			testAdmin.loginAttempts = 5;

			const result = passwordService.checkAccountLock(testAdmin);

			expect(result.isLocked).toBe(false);

			// Проверяем, что счетчик сброшен
			await testAdmin.reload();
			expect(testAdmin.loginAttempts).toBe(0);
			expect(testAdmin.lockedUntil).toBeNull();
		});
	});

	describe('handleFailedLogin', () => {
		test('should increment login attempts', async () => {
			testAdmin.loginAttempts = 0;
			const updatedAdmin = await passwordService.handleFailedLogin(
				testAdmin
			);

			expect(updatedAdmin.loginAttempts).toBe(1);
			expect(updatedAdmin.lockedUntil).toBeNull();
		});

		test('should lock account after max attempts', async () => {
			process.env.ADMIN_MAX_LOGIN_ATTEMPTS = '3';
			process.env.ADMIN_LOCKOUT_DURATION_MINUTES = '30';

			testAdmin.loginAttempts = 2;
			const updatedAdmin = await passwordService.handleFailedLogin(
				testAdmin
			);

			expect(updatedAdmin.loginAttempts).toBe(3);
			expect(updatedAdmin.lockedUntil).toBeDefined();

			const lockDate = new Date(updatedAdmin.lockedUntil);
			const now = new Date();
			const minutesDiff = Math.ceil((lockDate - now) / (1000 * 60));
			expect(minutesDiff).toBeGreaterThan(25);
			expect(minutesDiff).toBeLessThan(35);
		});
	});

	describe('resetLoginAttempts', () => {
		test('should reset login attempts and update last login', async () => {
			testAdmin.loginAttempts = 5;
			testAdmin.lockedUntil = new Date();
			testAdmin.lastLoginAt = null;

			const updatedAdmin = await passwordService.resetLoginAttempts(
				testAdmin
			);

			expect(updatedAdmin.loginAttempts).toBe(0);
			expect(updatedAdmin.lockedUntil).toBeNull();
			expect(updatedAdmin.lastLoginAt).toBeDefined();
		});
	});

	describe('checkPasswordChangeRequired', () => {
		test('should require change for expired password', () => {
			const pastDate = new Date();
			pastDate.setDate(pastDate.getDate() - 1);
			testAdmin.passwordExpiresAt = pastDate;

			const result =
				passwordService.checkPasswordChangeRequired(testAdmin);

			expect(result.changeRequired).toBe(true);
			expect(result.reason).toBe('password_expired');
			expect(result.message).toContain('истек');
		});

		test('should show warning for password expiring soon', () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 5);
			testAdmin.passwordExpiresAt = futureDate;

			const result =
				passwordService.checkPasswordChangeRequired(testAdmin);

			expect(result.changeRequired).toBe(false);
			expect(result.warning).toBe(true);
			expect(result.daysLeft).toBe(5);
			expect(result.message).toContain('5 дней');
		});

		test('should not require change for valid password', () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 30);
			testAdmin.passwordExpiresAt = futureDate;

			const result =
				passwordService.checkPasswordChangeRequired(testAdmin);

			expect(result.changeRequired).toBe(false);
			expect(result.warning).toBe(false);
		});
	});
});
