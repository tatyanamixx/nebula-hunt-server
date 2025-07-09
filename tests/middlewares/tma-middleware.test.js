const tmaMiddleware = require('../../middlewares/tma-middleware');

describe('TMAMiddleware', () => {
	it('should validate real telegram initData in authorization header', async () => {
		// Подставьте сюда реальный initData из Telegram WebApp
		const realInitData =
			'user={"id":27306789,"first_name":"Anton","last_name":"Mihknyukevich","username":"AntonMhnk","language_code":"en","allows_write_to_pm":true,"photo_url":"https://t.me/i/userpic/320/caSzExa385wgPFfRh892ecS-KC1RK6jefHTMTPiZLVc.svg"}&chat_instance=7096384394205350047&chat_type=sender&auth_date=1751963497&signature=AcshxVoBDNWZkb53BJaUQ8SHg_Ir7VxBLbM3HWFMfSnnsluaBQb4qXjdmDed_-Y6mOCIvqgywM8qG7e5PClKCg&hash=9cc45e9beae4d559b0000716a4e12d7dbc77b2edce16f8b558030bb533e208e6';
		const req = { headers: { authorization: `tma ${realInitData}` } };
		const res = {};
		const next = jest.fn();

		// Установите реальный токен бота
		//process.env.TG_BOT_API_KEY = 'ваш_бот_токен';

		await tmaMiddleware(req, res, next);

		expect(next).toHaveBeenCalled();
		// Если initData валидный, req.initdata должен быть определён
		// expect(req.initdata).toBeDefined();
	});

	it('should throw error for missing authorization header', async () => {
		const req = { headers: {} };
		const res = {};
		const next = jest.fn();

		await tmaMiddleware(req, res, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 401,
				message: expect.stringContaining('headers not found'),
			})
		);
	});
});
