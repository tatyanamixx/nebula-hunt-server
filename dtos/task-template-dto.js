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
			// Обрабатываем title - JSONB объект {en, ru}
			title: this.formatTitleField(taskTemplate.title),
			// Обрабатываем description - JSONB объект {en, ru}
			description: this.formatDescriptionField(taskTemplate.description),
			// Преобразуем поля в структурированный формат для веб-форм
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
		console.log("🔍 fromFormFormat - Input:", JSON.stringify(formData, null, 2));

		// Если данные приходят как массив, берем первый элемент
		const data = Array.isArray(formData) ? formData[0] : formData;
		console.log(
			"🔍 fromFormFormat - Processed data:",
			JSON.stringify(data, null, 2)
		);

		const result = {
			...data,
			// Преобразуем структурированные данные обратно в JSONB объекты
			title: this.parseTitleField(data.title),
			description: this.parseDescriptionField(data.description),
			reward: this.parseRewardField(data.reward),
			condition: this.parseConditionField(data.condition),
		};

		console.log("🔍 fromFormFormat - Output:", JSON.stringify(result, null, 2));
		return result;
	}

	/**
	 * Форматирует поле title для веб-формы
	 * @param {Object} title - JSONB объект {en, ru}
	 * @returns {Object} - Форматированный объект для формы
	 */
	static formatTitleField(title) {
		if (!title || typeof title !== "object") {
			return { en: "", ru: "" };
		}
		return {
			en: title.en || "",
			ru: title.ru || "",
		};
	}

	/**
	 * Форматирует поле description для веб-формы
	 * @param {Object} description - JSONB объект {en, ru}
	 * @returns {Object} - Форматированный объект для формы
	 */
	static formatDescriptionField(description) {
		if (!description || typeof description !== "object") {
			return { en: "", ru: "" };
		}
		return {
			en: description.en || "",
			ru: description.ru || "",
		};
	}

	/**
	 * Парсит поле title из веб-формы в JSONB формат
	 * @param {Object} title - Данные из формы
	 * @returns {Object} - JSONB объект для базы данных
	 */
	static parseTitleField(title) {
		console.log("🔍 parseTitleField - Input:", title);

		if (!title || typeof title !== "object") {
			console.log(
				"🔍 parseTitleField - Invalid input, returning empty object"
			);
			return { en: "", ru: "" };
		}

		const result = {
			en: title.en || "",
			ru: title.ru || "",
		};

		console.log("🔍 parseTitleField - Output:", result);
		return result;
	}

	/**
	 * Парсит поле description из веб-формы в JSONB формат
	 * @param {Object} description - Данные из формы
	 * @returns {Object} - JSONB объект для базы данных
	 */
	static parseDescriptionField(description) {
		if (!description || typeof description !== "object") {
			return { en: "", ru: "" };
		}
		return {
			en: description.en || "",
			ru: description.ru || "",
		};
	}

	/**
	 * Форматирует поле reward для веб-формы
	 * @param {Object} reward - JSONB объект награды
	 * @returns {Object} - Форматированный объект для формы
	 */
	static formatRewardField(reward) {
		if (!reward || typeof reward !== "object") {
			return {
				type: "stardust",
				amount: 0,
				multiplier: 1.0,
			};
		}

		return {
			type: reward.type || "stardust",
			amount: reward.amount || 0,
			multiplier: reward.multiplier || 1.0,
		};
	}

	/**
	 * Форматирует поле condition для веб-формы
	 * @param {Object} condition - JSONB объект условия
	 * @returns {Object} - Форматированный объект для формы
	 */
	static formatConditionField(condition) {
		if (!condition || typeof condition !== "object") {
			return {
				type: "totalStars",
				operator: ">=",
				value: 0,
			};
		}

		return {
			type: condition.type || "totalStars",
			operator: condition.operator || ">=",
			value: condition.value || condition.threshold || 0,
		};
	}

	/**
	 * Парсит поле reward из веб-формы в JSONB формат
	 * @param {Object} reward - Данные из формы
	 * @returns {Object} - JSONB объект для базы данных
	 */
	static parseRewardField(reward) {
		if (!reward || typeof reward !== "object") {
			return { type: "stardust", amount: 0 };
		}

		return {
			type: reward.type || "stardust",
			amount: parseInt(reward.amount) || 0,
			multiplier: parseFloat(reward.multiplier) || 1.0,
		};
	}

	/**
	 * Парсит поле condition из веб-формы в JSONB формат
	 * @param {Object} condition - Данные из формы
	 * @returns {Object} - JSONB объект для базы данных
	 */
	static parseConditionField(condition) {
		if (!condition || typeof condition !== "object") {
			return { type: "totalStars", operator: ">=", value: 0 };
		}

		return {
			type: condition.type || "totalStars",
			operator: condition.operator || ">=",
			value: parseInt(condition.value) || 0,
		};
	}

	/**
	 * Форматирует отображение награды для списка
	 * @param {Object} reward - JSONB объект награды
	 * @returns {string} - Строка для отображения
	 */
	static formatRewardDisplay(reward) {
		if (!reward || typeof reward !== "object") {
			return "0 stardust";
		}

		const amount = reward.amount || 0;
		const type = reward.type || "stardust";
		const multiplier = reward.multiplier || 1.0;

		let display = `${amount} ${type}`;
		if (multiplier !== 1.0) {
			display += ` (x${multiplier})`;
		}

		return display;
	}

	/**
	 * Преобразует массив TaskTemplate в формат для веб-форм
	 * @param {Array} taskTemplates - Массив объектов TaskTemplate
	 * @returns {Array} - Массив форматированных объектов
	 */
	static toFormFormatArray(taskTemplates) {
		if (!Array.isArray(taskTemplates)) {
			return [];
		}

		return taskTemplates.map((template) => this.toFormFormat(template));
	}

	/**
	 * Валидирует данные формы TaskTemplate
	 * @param {Object} formData - Данные из формы
	 * @returns {Object} - Результат валидации {isValid, errors}
	 */
	static validateFormData(formData) {
		const errors = [];

		// Проверяем обязательные поля
		if (!formData.slug || formData.slug.trim() === "") {
			errors.push("Slug is required");
		}

		// Проверяем title
		if (
			!formData.title ||
			!formData.title.en ||
			formData.title.en.trim() === ""
		) {
			errors.push("English title is required");
		}
		if (
			!formData.title ||
			!formData.title.ru ||
			formData.title.ru.trim() === ""
		) {
			errors.push("Russian title is required");
		}

		// Проверяем description
		if (
			!formData.description ||
			!formData.description.en ||
			formData.description.en.trim() === ""
		) {
			errors.push("English description is required");
		}
		if (
			!formData.description ||
			!formData.description.ru ||
			formData.description.ru.trim() === ""
		) {
			errors.push("Russian description is required");
		}

		// Проверяем reward
		if (!formData.reward || !formData.reward.type) {
			errors.push("Reward type is required");
		}
		if (
			!formData.reward ||
			!formData.reward.amount ||
			formData.reward.amount <= 0
		) {
			errors.push("Reward amount must be greater than 0");
		}

		// Проверяем condition
		if (!formData.condition || !formData.condition.type) {
			errors.push("Condition type is required");
		}
		if (
			!formData.condition ||
			!formData.condition.value ||
			formData.condition.value < 0
		) {
			errors.push("Condition value must be 0 or greater");
		}

		return {
			isValid: errors.length === 0,
			errors: errors,
		};
	}

	/**
	 * Валидирует JSONB поля для создания/обновления шаблона
	 * @param {Object} formData - Данные из формы
	 * @returns {Object} - Объект с ошибками валидации
	 */
	static validateJsonbFields(formData) {
		const errors = {};
		console.log(
			"🔍 DTO Validation - Input data:",
			JSON.stringify(formData, null, 2)
		);

		// Если данные приходят как массив, берем первый элемент
		const data = Array.isArray(formData) ? formData[0] : formData;
		console.log(
			"🔍 DTO Validation - Processed data:",
			JSON.stringify(data, null, 2)
		);

		// Проверяем slug
		if (!data.slug || data.slug.trim() === "") {
			errors.slug = "Slug is required";
			console.log("❌ Slug validation failed");
		}

		// Проверяем title
		if (!data.title) {
			errors.title = "Title is required";
			console.log("❌ Title validation failed - no title");
		} else if (typeof data.title === "object") {
			if (!data.title.en || data.title.en.trim() === "") {
				errors.title_en = "English title is required";
				console.log("❌ English title validation failed");
			}
			if (!data.title.ru || data.title.ru.trim() === "") {
				errors.title_ru = "Russian title is required";
				console.log("❌ Russian title validation failed");
			}
		}

		// Проверяем description
		if (!data.description) {
			errors.description = "Description is required";
			console.log("❌ Description validation failed - no description");
		} else if (typeof data.description === "object") {
			if (!data.description.en || data.description.en.trim() === "") {
				errors.description_en = "English description is required";
				console.log("❌ English description validation failed");
			}
			if (!data.description.ru || data.description.ru.trim() === "") {
				errors.description_ru = "Russian description is required";
				console.log("❌ Russian description validation failed");
			}
		}

		// Проверяем reward
		if (!data.reward) {
			errors.reward = "Reward is required";
			console.log("❌ Reward validation failed - no reward");
		} else if (typeof data.reward === "object") {
			if (!data.reward.type || data.reward.type.trim() === "") {
				errors.reward_type = "Reward type is required";
				console.log("❌ Reward type validation failed");
			}
			if (typeof data.reward.amount !== "number" || data.reward.amount < 0) {
				errors.reward_amount = "Reward amount must be a non-negative number";
				console.log(
					"❌ Reward amount validation failed:",
					data.reward.amount
				);
			}
		}

		// Проверяем icon
		if (!data.icon || data.icon.trim() === "") {
			errors.icon = "Icon is required";
			console.log("❌ Icon validation failed");
		}

		console.log("🔍 DTO Validation - Final errors:", errors);
		return errors;
	}
}

module.exports = TaskTemplateDTO;
