/**
 * Роутер для работы с view связок template-ребенок
 *
 * Предоставляет API endpoints для получения данных, объединяющих таблицы шаблонов
 * с таблицами пользовательских данных
 */

const express = require('express');
const router = express.Router();
const templateViewController = require('../controllers/template-view-controller');
const validateTelegramWebAppData = require('../middlewares/telegram-auth-middleware');
const authMiddleware = require('../middlewares/auth-middleware');

// Применяем middleware для валидации Telegram WebApp данных
router.use(validateTelegramWebAppData);

// Применяем middleware для аутентификации
router.use(authMiddleware);

// ===== АПГРЕЙДЫ =====

/**
 * @route GET /api/template-views/upgrades
 * @desc Получить все апгрейды пользователя с данными шаблонов
 * @access Private
 * @query {number} limit - Лимит записей
 * @query {number} offset - Смещение
 * @query {boolean} completed - Фильтр по завершенности
 * @query {string} category - Фильтр по категории
 * @query {string} templateSlug - Фильтр по slug шаблона
 * @query {string} order - Сортировка (field:direction,field:direction)
 */
router.get('/upgrades', templateViewController.getUserUpgradesWithTemplate);

/**
 * @route GET /api/template-views/upgrades/:upgradeId
 * @desc Получить конкретный апгрейд пользователя с данными шаблона
 * @access Private
 * @param {number} upgradeId - ID апгрейда
 */
router.get(
	'/upgrades/:upgradeId',
	templateViewController.getUserUpgradeWithTemplate
);

/**
 * @route GET /api/template-views/upgrades/stats
 * @desc Получить статистику по апгрейдам пользователя
 * @access Private
 */
router.get('/upgrades/stats', templateViewController.getUserUpgradesStats);

// ===== ЗАДАЧИ =====

/**
 * @route GET /api/template-views/tasks
 * @desc Получить все задачи пользователя с данными шаблонов
 * @access Private
 * @query {number} limit - Лимит записей
 * @query {number} offset - Смещение
 * @query {boolean} completed - Фильтр по завершенности
 * @query {boolean} active - Фильтр по активности
 * @query {string} templateSlug - Фильтр по slug шаблона
 * @query {string} order - Сортировка (field:direction,field:direction)
 */
router.get('/tasks', templateViewController.getUserTasksWithTemplate);

/**
 * @route GET /api/template-views/tasks/:taskId
 * @desc Получить конкретную задачу пользователя с данными шаблона
 * @access Private
 * @param {number} taskId - ID задачи
 */
router.get('/tasks/:taskId', templateViewController.getUserTaskWithTemplate);

/**
 * @route GET /api/template-views/tasks/stats
 * @desc Получить статистику по задачам пользователя
 * @access Private
 */
router.get('/tasks/stats', templateViewController.getUserTasksStats);

// ===== СОБЫТИЯ =====

/**
 * @route GET /api/template-views/events
 * @desc Получить все события пользователя с данными шаблонов
 * @access Private
 * @query {number} limit - Лимит записей
 * @query {number} offset - Смещение
 * @query {string} status - Фильтр по статусу (ACTIVE, COMPLETED, EXPIRED, CANCELLED)
 * @query {string} templateType - Фильтр по типу шаблона
 * @query {string} templateSlug - Фильтр по slug шаблона
 * @query {string} order - Сортировка (field:direction,field:direction)
 */
router.get('/events', templateViewController.getUserEventsWithTemplate);

/**
 * @route GET /api/template-views/events/:eventId
 * @desc Получить конкретное событие пользователя с данными шаблона
 * @access Private
 * @param {number} eventId - ID события
 */
router.get('/events/:eventId', templateViewController.getUserEventWithTemplate);

/**
 * @route GET /api/template-views/events/stats
 * @desc Получить статистику по событиям пользователя
 * @access Private
 */
router.get('/events/stats', templateViewController.getUserEventsStats);

// ===== ПАКЕТЫ =====

/**
 * @route GET /api/template-views/packages
 * @desc Получить все пакеты пользователя с данными шаблонов
 * @access Private
 * @query {number} limit - Лимит записей
 * @query {number} offset - Смещение
 * @query {boolean} isUsed - Фильтр по использованию
 * @query {boolean} isLocked - Фильтр по блокировке
 * @query {string} resource - Фильтр по ресурсу
 * @query {string} templateSlug - Фильтр по slug шаблона
 * @query {string} order - Сортировка (field:direction,field:direction)
 */
router.get('/packages', templateViewController.getUserPackagesWithTemplate);

/**
 * @route GET /api/template-views/packages/:packageId
 * @desc Получить конкретный пакет пользователя с данными шаблона
 * @access Private
 * @param {number} packageId - ID пакета
 */
router.get(
	'/packages/:packageId',
	templateViewController.getUserPackageWithTemplate
);

/**
 * @route GET /api/template-views/packages/stats
 * @desc Получить статистику по пакетам пользователя
 * @access Private
 */
router.get('/packages/stats', templateViewController.getUserPackagesStats);

// ===== АРТИФАКТЫ =====

/**
 * @route GET /api/template-views/artifacts
 * @desc Получить все артифакты пользователя с данными шаблонов
 * @access Private
 * @query {number} limit - Лимит записей
 * @query {number} offset - Смещение
 * @query {boolean} tradable - Фильтр по торговости
 * @query {string} templateRarity - Фильтр по редкости шаблона
 * @query {string} templateSlug - Фильтр по slug шаблона
 * @query {string} order - Сортировка (field:direction,field:direction)
 */
router.get('/artifacts', templateViewController.getUserArtifactsWithTemplate);

/**
 * @route GET /api/template-views/artifacts/:artifactId
 * @desc Получить конкретный артифакт пользователя с данными шаблона
 * @access Private
 * @param {number} artifactId - ID артифакта
 */
router.get(
	'/artifacts/:artifactId',
	templateViewController.getUserArtifactWithTemplate
);

/**
 * @route GET /api/template-views/artifacts/stats
 * @desc Получить статистику по артифактам пользователя
 * @access Private
 */
router.get('/artifacts/stats', templateViewController.getUserArtifactsStats);

// ===== ОБЩАЯ СТАТИСТИКА =====

/**
 * @route GET /api/template-views/stats
 * @desc Получить полную статистику пользователя по всем типам данных
 * @access Private
 */
router.get('/stats', templateViewController.getUserFullStats);

module.exports = router;
