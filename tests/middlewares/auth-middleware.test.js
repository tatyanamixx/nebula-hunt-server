/**
 * Tests for JWT Authentication Middleware
 * Created by Claude on 15.07.2025
 */
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middlewares/auth-middleware');
const tokenService = require('../../service/token-service');
const { User } = require('../../models/models');
const ApiError = require('../../exceptions/api-error');

// Mock dependencies
jest.mock('../../service/token-service');
jest.mock('../../models/models');
jest.mock('../../service/logger-service', () => ({
	debug: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

describe('Auth Middleware', () => {
	let mockReq;
	let mockRes;
	let mockNext;

	beforeEach(() => {
		mockReq = {
			headers: {},
			ip: '127.0.0.1',
			get: jest.fn(),
		};
		mockRes = {};
		mockNext = jest.fn();

		// Reset mocks
		jest.clearAllMocks();
	});

	describe('Authorization Header Validation', () => {
		it('should return 401 when Authorization header is missing', async () => {
			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining(
						'Authorization header required'
					),
				})
			);
		});

		it('should return 401 when Bearer scheme is missing', async () => {
			mockReq.headers.authorization = 'InvalidScheme token123';

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining('Bearer scheme required'),
				})
			);
		});

		it('should return 401 when token is missing after Bearer', async () => {
			mockReq.headers.authorization = 'Bearer';

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining('Access token required'),
				})
			);
		});
	});

	describe('Token Validation', () => {
		beforeEach(() => {
			mockReq.headers.authorization = 'Bearer valid-token';
		});

		it('should return 401 when token validation fails', async () => {
			tokenService.validateAccessToken.mockImplementation(() => {
				throw new Error('Invalid token');
			});

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining('Token validation failed'),
				})
			);
		});

		it('should return 401 when token is expired', async () => {
			const expiredError = new jwt.TokenExpiredError('Token expired');
			tokenService.validateAccessToken.mockImplementation(() => {
				throw expiredError;
			});

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining('Token expired'),
				})
			);
		});

		it('should return 401 when token is invalid', async () => {
			const invalidError = new jwt.JsonWebTokenError('Invalid token');
			tokenService.validateAccessToken.mockImplementation(() => {
				throw invalidError;
			});

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining('Invalid token'),
				})
			);
		});

		it('should return 401 when token validation returns null', async () => {
			tokenService.validateAccessToken.mockReturnValue(null);

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining('Invalid token'),
				})
			);
		});

		it('should return 401 when token payload is invalid', async () => {
			tokenService.validateAccessToken.mockReturnValue({
				// Missing id field
				username: 'testuser',
			});

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining('Invalid token payload'),
				})
			);
		});
	});

	describe('User Database Validation', () => {
		beforeEach(() => {
			mockReq.headers.authorization = 'Bearer valid-token';
			tokenService.validateAccessToken.mockReturnValue({
				id: 123,
				username: 'testuser',
			});
		});

		it('should return 401 when user is not found in database', async () => {
			User.findOne.mockResolvedValue(null);

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining('User not found'),
				})
			);
		});

		it('should return 403 when user is blocked', async () => {
			User.findOne.mockResolvedValue({
				id: 123,
				username: 'testuser',
				blocked: true,
			});

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 403,
					message: expect.stringContaining('Account is blocked'),
				})
			);
		});

		it('should return 500 when database error occurs', async () => {
			User.findOne.mockRejectedValue(
				new Error('Database connection failed')
			);

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 500,
					message: expect.stringContaining('Database error'),
				})
			);
		});
	});

	describe('Successful Authentication', () => {
		beforeEach(() => {
			mockReq.headers.authorization = 'Bearer valid-token';
			tokenService.validateAccessToken.mockReturnValue({
				id: 123,
				username: 'testuser',
			});
			User.findOne.mockResolvedValue({
				id: 123,
				username: 'testuser',
				blocked: false,
			});
		});

		it('should set user and userToken in request and call next', async () => {
			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockReq.user).toEqual({
				id: 123,
				username: 'testuser',
				blocked: false,
			});
			expect(mockReq.userToken).toEqual({
				id: 123,
				username: 'testuser',
			});
			expect(mockNext).toHaveBeenCalledWith();
		});

		it('should handle different token payload structures', async () => {
			const tokenPayload = {
				id: 456,
				email: 'test@example.com',
				role: 'USER',
			};
			tokenService.validateAccessToken.mockReturnValue(tokenPayload);
			User.findOne.mockResolvedValue({
				id: 456,
				username: 'testuser2',
				blocked: false,
			});

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockReq.userToken).toEqual(tokenPayload);
			expect(mockNext).toHaveBeenCalledWith();
		});
	});

	describe('Error Handling', () => {
		it('should handle unexpected errors gracefully', async () => {
			mockReq.headers.authorization = 'Bearer valid-token';
			tokenService.validateAccessToken.mockImplementation(() => {
				throw new Error('Unexpected error');
			});

			await authMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 500,
					message: expect.stringContaining('Authentication error'),
				})
			);
		});
	});
});
