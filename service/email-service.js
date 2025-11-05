const nodemailer = require("nodemailer");
const logger = require("./logger-service");

class EmailService {
	constructor() {
		this.transporter = null;
		this.initializeTransporter();
	}

	/**
	 * Инициализация транспорта для отправки email
	 */
	initializeTransporter() {
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
				logger.warn("SMTP configuration incomplete. Email sending will fail.", {
					SMTP_HOST: process.env.SMTP_HOST ? "set" : "missing",
					SMTP_USER: process.env.SMTP_USER ? "set" : "missing",
					SMTP_PASS: process.env.SMTP_PASS ? "set" : "missing",
				});
				// Создаем "пустой" transporter, который будет падать с понятной ошибкой
				this.transporter = null;
				return;
			}

			const smtpConfig = {
				host: process.env.SMTP_HOST,
				port: parseInt(process.env.SMTP_PORT) || 587,
				secure: process.env.SMTP_SECURE === "true",
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				},
			};

			logger.info("Initializing SMTP transporter", {
				host: smtpConfig.host,
				port: smtpConfig.port,
				secure: smtpConfig.secure,
				user: smtpConfig.auth.user,
			});

			this.transporter = nodemailer.createTransport(smtpConfig);
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
			// Проверяем наличие транспорта
			if (!this.transporter) {
				const error = new Error(
					"SMTP transporter not initialized. Check SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS)"
				);
				logger.error("Cannot send email: SMTP not configured", {
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

			const result = await this.transporter.sendMail(mailOptions);

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
}

module.exports = new EmailService();
