/**
 * Tests for Refresh Token Middleware
 * Created by Claude on 15.07.2025
 */
const jwt = require('jsonwebtoken');
const refreshTokenMiddleware = require('../../middlewares/refresh-token-middleware');
const tokenService = require('../../service/token-service');
const ApiError = require('../../exceptions/api-error');

// Mock dependencies
jest.mock('../../service/token-service');
jest.mock('../../service/logger-service', () => ({
	debug: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
}));

describe('Refresh Token Middleware', () => {
	let mockReq;
	let mockRes;
	let mockNext;

	beforeEach(() => {
		mockReq = {
			cookies: {},
			ip: '127.0.0.1',
			get: jest.fn(),
		};
		mockRes = {};
		mockNext = jest.fn();

		// Reset mocks
		jest.clearAllMocks();
	});

	describe('Missing Refresh Token', () => {
		it('should return 401 when refresh token is missing from cookies', async () => {
			await refreshTokenMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining(
						'Refresh token required in cookies'
					),
				})
			);
		});
	});

	describe('Token Validation', () => {
		beforeEach(() => {
			mockReq.cookies.refreshToken = 'valid-refresh-token';
		});

		it('should return 401 when token validation fails', async () => {
			tokenService.validateRefreshToken.mockImplementation(() => {
				throw new Error('Invalid token');
			});

			await refreshTokenMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining(
						'Refresh token validation failed'
					),
				})
			);
		});

		it('should return 401 when token is expired', async () => {
			const expiredError = new jwt.TokenExpiredError('Token expired');
			tokenService.validateRefreshToken.mockImplementation(() => {
				throw expiredError;
			});

			await refreshTokenMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining('Refresh token expired'),
				})
			);
		});

		it('should return 401 when token is invalid', async () => {
			const invalidError = new jwt.JsonWebTokenError('Invalid token');
			tokenService.validateRefreshToken.mockImplementation(() => {
				throw invalidError;
			});

			await refreshTokenMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining('Invalid refresh token'),
				})
			);
		});

		it('should return 401 when token payload is invalid', async () => {
			tokenService.validateRefreshToken.mockReturnValue({
				// Missing id field
				type: 'refresh',
			});

			await refreshTokenMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: expect.stringContaining(
						'Invalid refresh token payload'
					),
				})
			);
		});
	});

	describe('Successful Validation', () => {
		beforeEach(() => {
			mockReq.cookies.refreshToken = 'valid-refresh-token';
			tokenService.validateRefreshToken.mockReturnValue({
				id: 123,
				type: 'refresh',
			});
		});

		it('should set refreshTokenData and refreshToken in request and call next', async () => {
			await refreshTokenMiddleware(mockReq, mockRes, mockNext);

			expect(mockReq.refreshTokenData).toEqual({
				id: 123,
				type: 'refresh',
			});
			expect(mockReq.refreshToken).toBe('valid-refresh-token');
			expect(mockNext).toHaveBeenCalledWith();
		});

		it('should handle different user IDs', async () => {
			tokenService.validateRefreshToken.mockReturnValue({
				id: 456,
				type: 'refresh',
			});

			await refreshTokenMiddleware(mockReq, mockRes, mockNext);

			expect(mockReq.refreshTokenData.id).toBe(456);
			expect(mockNext).toHaveBeenCalledWith();
		});
	});

	describe('Error Handling', () => {
		beforeEach(() => {
			mockReq.cookies.refreshToken = 'valid-refresh-token';
		});

		it('should handle unexpected errors gracefully', async () => {
			tokenService.validateRefreshToken.mockImplementation(() => {
				throw new Error('Unexpected error');
			});

			await refreshTokenMiddleware(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 500,
					message: expect.stringContaining(
						'Refresh token middleware error'
					),
				})
			);
		});
	});
});
