/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 */
const path = require('path');

const development = {
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
			translateTime: 'SYS:standard',
			ignore: 'pid,hostname',
			messageFormat: '{msg} {req.method} {req.url}',
		},
	},
	level: process.env.LOG_LEVEL || 'debug', // Уровень из переменной окружения или debug по умолчанию
	// Redact sensitive information
	redact: ['req.headers.authorization', 'req.headers.cookie'],
};

const production = {
	transport: {
		target: 'pino/file',
		options: {
			destination: path.join(__dirname, '../logs/app.log'),
			mkdir: true,
		},
	},
	level: process.env.LOG_LEVEL || 'info', // Уровень из переменной окружения или info по умолчанию
	redact: ['req.headers.authorization', 'req.headers.cookie'],
};

module.exports =
	process.env.NODE_ENV === 'production' ? production : development;
