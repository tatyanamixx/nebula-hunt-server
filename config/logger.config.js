/**
 * created by Tatyana Mikhniukevich on 04.05.2025
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
	level: 'debug',
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
	level: 'info',
	redact: ['req.headers.authorization', 'req.headers.cookie'],
};

module.exports =
	process.env.NODE_ENV === 'production' ? production : development;
