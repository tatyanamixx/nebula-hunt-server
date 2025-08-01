/**
 * TaskTemplate DTO - Data Transfer Object
 * Преобразует JSONB поля в удобный для веб-форм формат
 */

class TaskTemplateDTO {
	/**
	 * Преобразует TaskTemplate в формат для веб-формы
	 * @param {Object} taskTemplate - Объект TaskTemplate из базы данных
	 * @returns {Object} - Форматированный объект для веб-формы
	 */
	static toFormFormat(taskTemplate) {
		return {
			...taskTemplate,
			// Преобразуем JSONB поля в структурированный формат для веб-форм
			title: this.formatTitleField(taskTemplate.title),
			description: this.formatDescriptionField(taskTemplate.description),
			reward: this.formatRewardField(taskTemplate.reward),
			condition: this.formatConditionField(taskTemplate.condition),
			// Добавляем краткое отображение reward для списка
			rewardDisplay: this.formatRewardDisplay(taskTemplate.reward),
		};
	}

	/**
	 * Преобразует данные из веб-формы обратно в формат для базы данных
	 * @param {Object} formData - Данные из веб-формы
	 * @returns {Object} - Форматированный объект для базы данных
	 */
	static fromFormFormat(formData) {
		return {
			...formData,
			// Преобразуем структурированные данные обратно в JSONB объекты
			title: this.parseTitleField(formData.title),
			description: this.parseDescriptionField(formData.description),
			reward: this.parseRewardField(formData.reward),
			condition: this.parseConditionField(formData.condition),
		};
	}

	/**
	 * Форматирует поле title для веб-формы
	 * @param {Object|string} field - JSONB поле title
	 * @returns {Object} - Структурированный объект для веб-формы
	 */
	static formatTitleField(field) {
		const title = this.parseJsonbField(field, 'title');
		return {
			en: title.en || '',
			ru: title.ru || '',
		};
	}

	/**
	 * Форматирует поле description для веб-формы
	 * @param {Object|string} field - JSONB поле description
	 * @returns {Object} - Структурированный объект для веб-формы
	 */
	static formatDescriptionField(field) {
		const description = this.parseJsonbField(field, 'description');
		return {
			en: description.en || '',
			ru: description.ru || '',
		};
	}

	/**
	 * Форматирует поле reward для веб-формы
	 * @param {Object|string} field - JSONB поле reward
	 * @returns {Object} - Структурированный объект для веб-формы
	 */
	static formatRewardField(field) {
		const reward = this.parseJsonbField(field, 'reward');
		return {
			type: reward.type || 'stardust',
			amount: reward.amount || 0,
			multiplier: reward.multiplier || 1.0,
		};
	}

	/**
	 * Форматирует поле condition для веб-формы
	 * @param {Object|string} field - JSONB поле condition
	 * @returns {Object} - Структурированный объект для веб-формы
	 */
	static formatConditionField(field) {
		const condition = this.parseJsonbField(field, 'condition');
		return {
			type: condition.type || '',
			days: condition.days || [],
			amount: condition.amount || 0,
			operator: condition.operator || '>=',
			resource: condition.resource || '',
			resetTime: condition.resetTime || '00:00',
		};
	}

	/**
	 * Форматирует краткое отображение reward для списка
	 * @param {Object|string} field - JSONB поле reward
	 * @returns {string} - Краткое описание награды (например: "500 stardust")
	 */
	static formatRewardDisplay(field) {
		const reward = this.parseJsonbField(field, 'reward');
		const amount = reward.amount || 0;
		const type = reward.type || 'stardust';
		const multiplier = reward.multiplier || 1.0;

		// Если есть multiplier, показываем его
		if (multiplier !== 1.0) {
			return `${amount} ${type} (x${multiplier})`;
		}

		return `${amount} ${type}`;
	}

	/**
	 * Парсит поле title из веб-формы
	 * @param {Object} field - Данные из веб-формы
	 * @returns {Object} - JSONB объект
	 */
	static parseTitleField(field) {
		if (typeof field === 'object' && field !== null) {
			return {
				en: field.en || '',
				ru: field.ru || '',
			};
		}
		return { en: '', ru: '' };
	}

	/**
	 * Парсит поле description из веб-формы
	 * @param {Object} field - Данные из веб-формы
	 * @returns {Object} - JSONB объект
	 */
	static parseDescriptionField(field) {
		if (typeof field === 'object' && field !== null) {
			return {
				en: field.en || '',
				ru: field.ru || '',
			};
		}
		return { en: '', ru: '' };
	}

	/**
	 * Парсит поле reward из веб-формы
	 * @param {Object} field - Данные из веб-формы
	 * @returns {Object} - JSONB объект
	 */
	static parseRewardField(field) {
		if (typeof field === 'object' && field !== null) {
			return {
				type: field.type || 'stardust',
				amount: parseInt(field.amount) || 0,
				multiplier: parseFloat(field.multiplier) || 1.0,
			};
		}
		return { type: 'stardust', amount: 0, multiplier: 1.0 };
	}

	/**
	 * Парсит поле condition из веб-формы
	 * @param {Object} field - Данные из веб-формы
	 * @returns {Object} - JSONB объект
	 */
	static parseConditionField(field) {
		if (typeof field === 'object' && field !== null) {
			return {
				type: field.type || '',
				days: Array.isArray(field.days) ? field.days : [],
				amount: parseInt(field.amount) || 0,
				operator: field.operator || '>=',
				resource: field.resource || '',
				resetTime: field.resetTime || '00:00',
			};
		}
		return {
			type: '',
			days: [],
			amount: 0,
			operator: '>=',
			resource: '',
			resetTime: '00:00',
		};
	}

	/**
	 * Форматирует JSONB поле в строку для веб-формы (для обратной совместимости)
	 * @param {Object|string} field - JSONB поле
	 * @param {string} fieldName - Название поля для логирования
	 * @returns {string} - JSON строка
	 */
	static formatJsonbField(field, fieldName) {
		if (typeof field === 'string') {
			try {
				// Если это уже строка, попробуем распарсить и переформатировать
				const parsed = JSON.parse(field);
				return JSON.stringify(parsed, null, 2);
			} catch (error) {
				console.warn(`Failed to parse ${fieldName} as JSON:`, error);
				return field;
			}
		} else if (typeof field === 'object' && field !== null) {
			// Если это объект, преобразуем в JSON строку
			return JSON.stringify(field, null, 2);
		} else {
			// Если поле пустое или null, возвращаем пустой объект
			return JSON.stringify({}, null, 2);
		}
	}

	/**
	 * Парсит строку обратно в JSONB объект
	 * @param {string} field - JSON строка из веб-формы
	 * @param {string} fieldName - Название поля для логирования
	 * @returns {Object} - JSONB объект
	 */
	static parseJsonbField(field, fieldName) {
		if (typeof field === 'object' && field !== null) {
			// Если это уже объект, возвращаем как есть
			return field;
		} else if (typeof field === 'string' && field.trim()) {
			try {
				// Если это строка, парсим JSON
				return JSON.parse(field);
			} catch (error) {
				console.error(`Failed to parse ${fieldName} as JSON:`, error);
				// Возвращаем пустой объект в случае ошибки
				return {};
			}
		} else {
			// Если поле пустое, возвращаем пустой объект
			return {};
		}
	}

	/**
	 * Преобразует массив TaskTemplate в формат для веб-форм
	 * @param {Array} taskTemplates - Массив TaskTemplate
	 * @returns {Array} - Массив форматированных объектов
	 */
	static toFormFormatArray(taskTemplates) {
		return taskTemplates.map((task) => this.toFormFormat(task));
	}

	/**
	 * Валидирует JSONB поля
	 * @param {Object} formData - Данные из веб-формы
	 * @returns {Object} - Объект с ошибками валидации
	 */
	static validateJsonbFields(formData) {
		const errors = {};

		// Валидируем title
		try {
			const title = this.parseTitleField(formData.title);
			if (!title.en || !title.ru) {
				errors.title = 'Title must contain both "en" and "ru" fields';
			}
		} catch (error) {
			errors.title = 'Invalid title format';
		}

		// Валидируем description
		try {
			const description = this.parseDescriptionField(
				formData.description
			);
			if (!description.en || !description.ru) {
				errors.description =
					'Description must contain both "en" and "ru" fields';
			}
		} catch (error) {
			errors.description = 'Invalid description format';
		}

		// Валидируем reward
		try {
			const reward = this.parseRewardField(formData.reward);
			if (!reward.type || typeof reward.amount !== 'number') {
				errors.reward =
					'Reward must contain "type" and "amount" fields';
			}
		} catch (error) {
			errors.reward = 'Invalid reward format';
		}

		// Валидируем condition
		try {
			const condition = this.parseConditionField(formData.condition);
			if (!condition.type) {
				errors.condition = 'Condition must contain "type" field';
			}
		} catch (error) {
			errors.condition = 'Invalid condition format';
		}

		return errors;
	}
}

module.exports = TaskTemplateDTO;
