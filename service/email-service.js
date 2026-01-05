const nodemailer = require("nodemailer");
const dns = require("dns");
const axios = require("axios");
const logger = require("./logger-service");

class EmailService {
	constructor() {
		this.transporter = null;
		this.emailjsConfig = null;
		this.initializeTransporter();
	}

	/**
	 * Инициализация транспорта для отправки email
	 */
	initializeTransporter() {
		// Проверяем, используется ли EmailJS (приоритет над SMTP)
		// Для серверных запросов EmailJS требует ОБА ключа:
		// - Public Key в user_id (идентификация аккаунта)
		// - Private Key в accessToken (аутентификация)
		const emailjsPublicKey = process.env.EMAILJS_PUBLIC_KEY;
		const emailjsPrivateKey = process.env.EMAILJS_PRIVATE_KEY;

		if (
			emailjsPublicKey &&
			emailjsPrivateKey &&
			process.env.EMAILJS_SERVICE_ID
		) {
			// Оба ключа требуются для серверных запросов
			this.emailjsConfig = {
				publicKey: emailjsPublicKey, // Public Key для user_id
				privateKey: emailjsPrivateKey, // Private Key для accessToken
				serviceId: process.env.EMAILJS_SERVICE_ID,
				templateId: process.env.EMAILJS_TEMPLATE_ID || "template_default",
			};
			console.log("📧 [EMAIL-SERVICE] Using EmailJS for email sending", {
				serviceId: this.emailjsConfig.serviceId,
				templateId: this.emailjsConfig.templateId,
				hasPublicKey: !!this.emailjsConfig.publicKey,
				hasPrivateKey: !!this.emailjsConfig.privateKey,
			});
			logger.info("EmailJS configured", {
				serviceId: this.emailjsConfig.serviceId,
				hasTemplateId: !!this.emailjsConfig.templateId,
				hasPublicKey: !!this.emailjsConfig.publicKey,
				hasPrivateKey: !!this.emailjsConfig.privateKey,
			});
			return; // EmailJS не требует transporter
		} else if (emailjsPublicKey && process.env.EMAILJS_SERVICE_ID) {
			// Только Public Key (для клиентских запросов, не рекомендуется для сервера)
			this.emailjsConfig = {
				publicKey: emailjsPublicKey,
				privateKey: null,
				serviceId: process.env.EMAILJS_SERVICE_ID,
				templateId: process.env.EMAILJS_TEMPLATE_ID || "template_default",
			};
			console.log(
				"⚠️ [EMAIL-SERVICE] Using EmailJS with Public Key only (not recommended for server-side)"
			);
			logger.warn(
				"EmailJS configured with Public Key only (not recommended for server-side)"
			);
			return;
		}

		// Для разработки используем Ethereal Email (тестовый сервис)
		if (process.env.NODE_ENV === "development") {
			this.transporter = nodemailer.createTransport({
				host: "smtp.ethereal.email",
				port: 587,
				secure: false,
				auth: {
					user: process.env.ETHEREAL_USER || "test@ethereal.email",
					pass: process.env.ETHEREAL_PASS || "test123",
				},
			});
		} else {
			// Для продакшена используем реальный SMTP
			// Проверяем наличие обязательных переменных
			if (
				!process.env.SMTP_HOST ||
				!process.env.SMTP_USER ||
				!process.env.SMTP_PASS
			) {
				logger.warn(
					"SMTP configuration incomplete. Email sending will fail.",
					{
						SMTP_HOST: process.env.SMTP_HOST ? "set" : "missing",
						SMTP_USER: process.env.SMTP_USER ? "set" : "missing",
						SMTP_PASS: process.env.SMTP_PASS ? "set" : "missing",
					}
				);
				// Создаем "пустой" transporter, который будет падать с понятной ошибкой
				this.transporter = null;
				return;
			}

			const smtpPort = parseInt(process.env.SMTP_PORT) || 587;

			// Для Yandex: для порта 465 (SSL) используем доменное имя (SSL требует правильный hostname)
			// Для порта 587 (STARTTLS) можно попробовать IPv4 адрес
			let smtpHost = process.env.SMTP_HOST;
			if (smtpHost === "smtp.yandex.ru") {
				if (smtpPort === 465) {
					// Для SSL используем доменное имя (сертификат привязан к домену)
					smtpHost = "smtp.yandex.ru";
					console.log(
						"📧 [EMAIL-SERVICE] Using domain name for Yandex SMTP SSL (port 465):",
						smtpHost
					);
				} else if (smtpPort === 587) {
					// Для STARTTLS можно попробовать IPv4
					smtpHost = "77.88.21.158";
					console.log(
						"📧 [EMAIL-SERVICE] Using IPv4 address for Yandex SMTP STARTTLS (port 587):",
						smtpHost
					);
				}
			}
			// Автоматически устанавливаем secure в зависимости от порта
			// Порт 465 = SSL (secure: true), Порт 587 = STARTTLS (secure: false)
			let smtpSecure;
			if (smtpPort === 465) {
				smtpSecure = true; // SSL для порта 465
			} else if (smtpPort === 587) {
				smtpSecure = false; // STARTTLS для порта 587 (игнорируем SMTP_SECURE)
			} else {
				smtpSecure = process.env.SMTP_SECURE === "true"; // Для других портов используем SMTP_SECURE
			}

			const smtpConfig = {
				host: smtpHost,
				port: smtpPort,
				secure: smtpSecure,
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				},
				// Таймауты для подключения (увеличены для медленных соединений)
				connectionTimeout: 60000, // 60 секунд на подключение
				socketTimeout: 60000, // 60 секунд на операции
				greetingTimeout: 30000, // 30 секунд на приветствие
				// Для порта 587 (STARTTLS)
				requireTLS: smtpPort === 587,
				// TLS опции для более надежного подключения
				tls: {
					rejectUnauthorized: false, // Не проверять сертификат (для некоторых провайдеров)
					minVersion: "TLSv1.2",
					// Для SSL (порт 465) всегда используем правильный hostname
					// Для STARTTLS (порт 587) с IP адресом тоже указываем hostname
					servername:
						process.env.SMTP_HOST === "smtp.yandex.ru" ||
						process.env.SMTP_HOST === "smtp.gmail.com"
							? process.env.SMTP_HOST
							: undefined,
				},
				// Дополнительные опции для подключения
				pool: false, // Не использовать pool
				debug: true, // Включить debug для отладки SMTP соединения
			};

			console.log("📧 [EMAIL-SERVICE] Initializing SMTP transporter", {
				host: smtpConfig.host,
				port: smtpConfig.port,
				secure: smtpConfig.secure,
				requireTLS: smtpConfig.requireTLS,
				connectionTimeout: smtpConfig.connectionTimeout,
				socketTimeout: smtpConfig.socketTimeout,
				user: smtpConfig.auth.user,
			});
			logger.info("Initializing SMTP transporter", {
				host: smtpConfig.host,
				port: smtpConfig.port,
				secure: smtpConfig.secure,
				requireTLS: smtpConfig.requireTLS,
				user: smtpConfig.auth.user,
			});

			this.transporter = nodemailer.createTransport(smtpConfig);
			console.log("✅ [EMAIL-SERVICE] SMTP transporter initialized");
		}
	}

	/**
	 * Отправка email с приглашением администратора
	 * @param {string} email - Email получателя
	 * @param {string} name - Имя получателя
	 * @param {string} role - Роль
	 * @param {string} token - Токен приглашения
	 */
	async sendAdminInvite(email, name, role, token) {
		try {
			// Если настроен EmailJS, используем его
			if (this.emailjsConfig) {
				return await this.sendAdminInviteViaEmailJS(
					email,
					name,
					role,
					token
				);
			}

			// Проверяем наличие транспорта для SMTP
			if (!this.transporter) {
				const error = new Error(
					"Email service not configured. Please set EMAILJS_PUBLIC_KEY and EMAILJS_SERVICE_ID, or SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables."
				);
				logger.error("Cannot send email: Email service not configured", {
					email,
					name,
					role,
					error: error.message,
				});
				throw error;
			}

			const frontendUrl =
				process.env.FRONTEND_URL ||
				process.env.CLIENT_URL ||
				"https://admin.nebulahunt.site";
			const inviteUrl = `${frontendUrl}/admin/register?token=${token}`;

			console.log("📧 [EMAIL-SERVICE] Preparing to send admin invite email", {
				to: email,
				from:
					process.env.SMTP_FROM ||
					process.env.SMTP_USER ||
					"noreply@nebulahunt.com",
			});
			logger.info("Preparing to send admin invite email", {
				to: email,
				from:
					process.env.SMTP_FROM ||
					process.env.SMTP_USER ||
					"noreply@nebulahunt.com",
				inviteUrl: inviteUrl.substring(0, 50) + "...",
			});

			const mailOptions = {
				from:
					process.env.SMTP_FROM ||
					process.env.SMTP_USER ||
					"noreply@nebulahunt.com",
				to: email,
				subject: "Invitation to join Nebulahunt Admin Panel",
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2 style="color: #333;">Welcome to Nebulahunt Admin Panel</h2>
						<p>Hello ${name},</p>
						<p>You have been invited to join the Nebulahunt Admin Panel as a <strong>${role}</strong>.</p>
						<p>To accept this invitation, please click the link below:</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${inviteUrl}" 
							   style="background-color: #007bff; color: white; padding: 12px 24px; 
							          text-decoration: none; border-radius: 5px; display: inline-block;">
								Accept Invitation
							</a>
						</div>
						<p><strong>Important:</strong></p>
						<ul>
							<li>This invitation link will expire in 7 days</li>
							<li>Please complete your registration within this time</li>
							<li>If you did not expect this invitation, please ignore this email</li>
						</ul>
						<p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
						<p style="word-break: break-all; color: #666;">${inviteUrl}</p>
						<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
						<p style="color: #666; font-size: 12px;">
							This is an automated message from Nebulahunt Admin Panel. 
							Please do not reply to this email.
						</p>
					</div>
				`,
			};

			console.log("📧 [EMAIL-SERVICE] Calling transporter.sendMail...");
			const result = await this.transporter.sendMail(mailOptions);
			console.log("✅ [EMAIL-SERVICE] transporter.sendMail completed", {
				messageId: result.messageId,
			});

			logger.info("Admin invite email sent successfully", {
				email,
				name,
				role,
				messageId: result.messageId,
			});

			return {
				success: true,
				messageId: result.messageId,
			};
		} catch (error) {
			console.error("❌ [EMAIL-SERVICE] Failed to send admin invite email", {
				error: error.message,
				errorCode: error.code,
				email,
			});
			logger.error("Failed to send admin invite email", {
				error: error.message,
				errorCode: error.code,
				email,
				name,
				role,
				stack: error.stack,
			});

			// В режиме разработки показываем ссылку в консоли
			if (process.env.NODE_ENV === "development") {
				const frontendUrl =
					process.env.FRONTEND_URL ||
					process.env.CLIENT_URL ||
					"http://localhost:3000";
				const inviteUrl = `${frontendUrl}/admin/register?token=${token}`;
				console.log("\n📧 DEVELOPMENT MODE - Email would be sent:");
				console.log(`📧 To: ${email}`);
				console.log(`📧 Subject: Invitation to join Nebulahunt Admin Panel`);
				console.log(`📧 Invite URL: ${inviteUrl}`);
				console.log("📧 In production, this would be sent via email\n");
			}

			// Более информативная ошибка
			if (error.message.includes("SMTP transporter not initialized")) {
				throw new Error(
					"Email service not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables."
				);
			}

			throw error;
		}
	}

	/**
	 * Отправка приглашения через EmailJS API
	 * @param {string} email - Email получателя
	 * @param {string} name - Имя получателя
	 * @param {string} role - Роль
	 * @param {string} token - Токен приглашения
	 */
	async sendAdminInviteViaEmailJS(email, name, role, token) {
		try {
			const frontendUrl =
				process.env.FRONTEND_URL ||
				process.env.CLIENT_URL ||
				"https://admin.nebulahunt.site";
			const inviteUrl = `${frontendUrl}/admin/register?token=${token}`;

			console.log(
				"📧 [EMAIL-SERVICE] Preparing to send admin invite via EmailJS",
				{
					to: email,
					serviceId: this.emailjsConfig.serviceId,
					templateId: this.emailjsConfig.templateId,
					hasPublicKey: !!this.emailjsConfig.publicKey,
					hasPrivateKey: !!this.emailjsConfig.privateKey,
					publicKeyPrefix: this.emailjsConfig.publicKey
						? this.emailjsConfig.publicKey.substring(0, 8) + "..."
						: "missing",
					privateKeyPrefix: this.emailjsConfig.privateKey
						? this.emailjsConfig.privateKey.substring(0, 8) + "..."
						: "missing",
				}
			);

			// EmailJS API endpoint
			const emailjsUrl = `https://api.emailjs.com/api/v1.0/email/send`;

			// Данные для отправки через EmailJS
			// EmailJS API требует ОБА ключа для серверных запросов:
			// - user_id: Public Key (идентификация аккаунта)
			// - accessToken: Private Key (аутентификация)
			const emailjsData = {
				service_id: this.emailjsConfig.serviceId,
				template_id: this.emailjsConfig.templateId,
				user_id: this.emailjsConfig.publicKey, // Public Key для идентификации
				template_params: {
					to_email: email,
					to_name: name,
					role: role,
					invite_url: inviteUrl,
					from_name: "Nebulahunt Admin Panel",
				},
			};

			// Добавляем Private Key в accessToken (если есть)
			if (this.emailjsConfig.privateKey) {
				emailjsData.accessToken = this.emailjsConfig.privateKey;
			}

			console.log("📧 [EMAIL-SERVICE] Calling EmailJS API...", {
				url: emailjsUrl,
				service_id: emailjsData.service_id,
				template_id: emailjsData.template_id,
				has_user_id: !!emailjsData.user_id,
				has_accessToken: !!emailjsData.accessToken,
				user_id_prefix: emailjsData.user_id
					? emailjsData.user_id.substring(0, 8) + "..."
					: "missing",
				accessToken_prefix: emailjsData.accessToken
					? emailjsData.accessToken.substring(0, 8) + "..."
					: "missing",
				template_params_keys: Object.keys(emailjsData.template_params),
			});

			const response = await axios.post(emailjsUrl, emailjsData, {
				headers: {
					"Content-Type": "application/json",
				},
				timeout: 30000, // 30 секунд таймаут
			});

			if (response.status === 200) {
				console.log(
					"✅ [EMAIL-SERVICE] EmailJS API response:",
					response.data
				);
				logger.info("Admin invite email sent via EmailJS", {
					email,
					name,
					role,
					status: response.status,
				});

				return {
					success: true,
					messageId: response.data?.message_id || "emailjs_sent",
					method: "emailjs",
				};
			} else {
				throw new Error(`EmailJS API returned status ${response.status}`);
			}
		} catch (error) {
			// Детальная информация об ошибке
			const errorDetails = {
				error: error.message,
				errorCode: error.code,
				email,
				status: error.response?.status,
				statusText: error.response?.statusText,
				responseData: error.response?.data,
			};

			console.error(
				"❌ [EMAIL-SERVICE] Failed to send admin invite via EmailJS",
				errorDetails
			);
			logger.error("Failed to send admin invite via EmailJS", {
				error: error.message,
				errorCode: error.code,
				status: error.response?.status,
				statusText: error.response?.statusText,
				responseData: error.response?.data,
				email,
				name,
				role,
				stack: error.stack,
			});

			// Более информативная ошибка для пользователя
			if (error.response?.status === 400 || error.response?.status === 403) {
				const responseData = error.response?.data;
				let errorMessage = `EmailJS API returned ${error.response?.status} ${error.response?.statusText}. Possible causes:\n`;

				if (error.response?.status === 400) {
					errorMessage +=
						"1. ⚠️ Invalid Key - Use EMAILJS_PRIVATE_KEY for server-side requests (not EMAILJS_PUBLIC_KEY)\n";
					errorMessage += "2. Invalid Service ID (EMAILJS_SERVICE_ID)\n";
					errorMessage += "3. Invalid Template ID (EMAILJS_TEMPLATE_ID)\n";
					errorMessage += "4. Key not found in EmailJS Dashboard\n";
					errorMessage +=
						"\n💡 Solution: Get Private Key from EmailJS Dashboard → Account → Private Keys\n";
				} else if (error.response?.status === 403) {
					errorMessage += "1. Invalid Private Key (EMAILJS_PRIVATE_KEY)\n";
					errorMessage += "2. Invalid Service ID (EMAILJS_SERVICE_ID)\n";
					errorMessage += "3. Invalid Template ID (EMAILJS_TEMPLATE_ID)\n";
					errorMessage += "4. API rate limit exceeded\n";
					errorMessage +=
						"5. Security settings in EmailJS account (blockHeadless, blockList)\n";
				}

				if (responseData) {
					const responseText =
						typeof responseData === "string"
							? responseData
							: JSON.stringify(responseData);
					errorMessage += `\nEmailJS response: ${responseText}`;
				}

				errorMessage += `\n\nCurrent config: hasPublicKey=${!!this
					.emailjsConfig.publicKey}, hasPrivateKey=${!!this.emailjsConfig
					.privateKey}, serviceId=${
					this.emailjsConfig.serviceId
				}, templateId=${this.emailjsConfig.templateId}`;

				throw new Error(errorMessage);
			}

			// В режиме разработки показываем ссылку в консоли
			if (process.env.NODE_ENV === "development") {
				const frontendUrl =
					process.env.FRONTEND_URL ||
					process.env.CLIENT_URL ||
					"http://localhost:3000";
				const inviteUrl = `${frontendUrl}/admin/register?token=${token}`;
				console.log("\n📧 DEVELOPMENT MODE - Email would be sent:");
				console.log(`📧 To: ${email}`);
				console.log(`📧 Subject: Invitation to join Nebulahunt Admin Panel`);
				console.log(`📧 Invite URL: ${inviteUrl}`);
				console.log("📧 In production, this would be sent via EmailJS\n");
			}

			throw error;
		}
	}

	/**
	 * Проверка соединения с SMTP сервером
	 */
	async verifyConnection() {
		try {
			if (!this.transporter) {
				throw new Error("SMTP transporter not initialized");
			}
			await this.transporter.verify();
			logger.info("SMTP connection verified successfully", {});
			return true;
		} catch (error) {
			logger.error("SMTP connection verification failed", {
				error: error.message,
			});
			return false;
		}
	}

	/**
	 * Получить transporter (для тестирования)
	 */
	getTransporter() {
		return this.transporter;
	}

	/**
	 * Получить конфигурацию EmailJS (для тестирования)
	 */
	getEmailJSConfig() {
		return this.emailjsConfig;
	}
}

module.exports = new EmailService();
