const packageTemplateService = require('../service/package-template-service');
const { SYSTEM_USER_ID } = require('../config/constants');

class PackageTemplateController {
	/**
	 * Получение всех активных шаблонов пакетов
	 * @param {Object} req Запрос
	 * @param {Object} res Ответ
	 * @param {Function} next Следующий middleware
	 */
	async getAllTemplates(req, res, next) {
		try {
			const { category, sortBy, sortDir } = req.query;

			const templates = await packageTemplateService.getAllTemplates({
				category,
				sortBy,
				sortDir,
			});

			res.json(templates);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Получение шаблона пакета по ID
	 * @param {Object} req Запрос
	 * @param {Object} res Ответ
	 * @param {Function} next Следующий middleware
	 */
	async getTemplateById(req, res, next) {
		try {
			const { id } = req.params;

			const template = await packageTemplateService.getTemplateById(id);

			res.json(template);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Создание шаблона пакета (только для администраторов)
	 * @param {Object} req Запрос
	 * @param {Object} res Ответ
	 * @param {Function} next Следующий middleware
	 */
	async createTemplate(req, res, next) {
		try {
			const templateData = req.body;

			const template = await packageTemplateService.createTemplate(
				templateData
			);

			res.status(201).json(template);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Обновление шаблона пакета (только для администраторов)
	 * @param {Object} req Запрос
	 * @param {Object} res Ответ
	 * @param {Function} next Следующий middleware
	 */
	async updateTemplate(req, res, next) {
		try {
			const { id } = req.params;
			const templateData = req.body;

			const template = await packageTemplateService.updateTemplate(
				id,
				templateData
			);

			res.json(template);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Изменение статуса шаблона пакета (только для администраторов)
	 * @param {Object} req Запрос
	 * @param {Object} res Ответ
	 * @param {Function} next Следующий middleware
	 */
	async changeTemplateStatus(req, res, next) {
		try {
			const { id } = req.params;
			const { status } = req.body;

			const template = await packageTemplateService.changeTemplateStatus(
				id,
				status
			);

			res.json(template);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Создание оферты на основе шаблона пакета (только для администраторов)
	 * @param {Object} req Запрос
	 * @param {Object} res Ответ
	 * @param {Function} next Следующий middleware
	 */
	async createOfferFromTemplate(req, res, next) {
		try {
			const { id } = req.params;

			const offer = await packageTemplateService.createOfferFromTemplate(
				id
			);

			res.status(201).json(offer);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new PackageTemplateController();
