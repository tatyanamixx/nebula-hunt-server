/**
 * Конфигурация внутренних кодов ошибок для фронтенда
 * created by Claude on 23.07.2025
 */

const ERROR_CODES = {
	// Ошибки аутентификации и авторизации
	AUTH: {
		USER_NOT_FOUND: 'AUTH_001',
		USER_ALREADY_EXISTS: 'AUTH_002',
		INVALID_TOKEN: 'AUTH_003',
		TOKEN_EXPIRED: 'AUTH_004',
		INSUFFICIENT_PERMISSIONS: 'AUTH_005',
		TELEGRAM_AUTH_FAILED: 'AUTH_006',
		USER_BLOCKED: 'AUTH_007',
	},

	// Ошибки валидации данных
	VALIDATION: {
		INVALID_USERNAME: 'VAL_001',
		INVALID_REFERRAL: 'VAL_002',
		INVALID_GALAXY_DATA: 'VAL_003',
		INVALID_OFFER_DATA: 'VAL_004',
		MISSING_REQUIRED_FIELDS: 'VAL_005',
		INVALID_SEED_FORMAT: 'VAL_006',
		INVALID_PRICE_FORMAT: 'VAL_007',
		INVALID_CURRENCY: 'VAL_008',
	},

	// Ошибки галактик
	GALAXY: {
		GALAXY_NOT_FOUND: 'GAL_001',
		GALAXY_ALREADY_EXISTS: 'GAL_002',
		DUPLICATE_SEED: 'GAL_003',
		INVALID_GALAXY_PROPERTIES: 'GAL_004',
		GALAXY_NOT_OWNED: 'GAL_005',
		INSUFFICIENT_STARS: 'GAL_006',
		GALAXY_CREATION_FAILED: 'GAL_007',
	},

	// Ошибки маркета и транзакций
	MARKET: {
		OFFER_NOT_FOUND: 'MKT_001',
		OFFER_ALREADY_EXISTS: 'MKT_002',
		INSUFFICIENT_FUNDS: 'MKT_003',
		TRANSACTION_FAILED: 'MKT_004',
		INVALID_OFFER_TYPE: 'MKT_005',
		OFFER_EXPIRED: 'MKT_006',
		PAYMENT_FAILED: 'MKT_007',
	},

	// Ошибки артефактов
	ARTIFACT: {
		ARTIFACT_NOT_FOUND: 'ART_001',
		ARTIFACT_ALREADY_EXISTS: 'ART_002',
		INVALID_ARTIFACT_TEMPLATE: 'ART_003',
		ARTIFACT_NOT_OWNED: 'ART_004',
		ARTIFACT_NOT_TRADABLE: 'ART_005',
	},

	// Ошибки пользовательского состояния
	USER_STATE: {
		STATE_NOT_FOUND: 'USR_001',
		STATE_CREATION_FAILED: 'USR_002',
		INSUFFICIENT_RESOURCES: 'USR_003',
		DAILY_BONUS_ALREADY_CLAIMED: 'USR_004',
		STREAK_UPDATE_FAILED: 'USR_005',
	},

	// Ошибки апгрейдов
	UPGRADE: {
		UPGRADE_NOT_FOUND: 'UPG_001',
		UPGRADE_ALREADY_COMPLETED: 'UPG_002',
		INSUFFICIENT_PROGRESS: 'UPG_003',
		UPGRADE_TEMPLATE_NOT_FOUND: 'UPG_004',
		MAX_LEVEL_REACHED: 'UPG_005',
	},

	// Ошибки задач
	TASK: {
		TASK_NOT_FOUND: 'TSK_001',
		TASK_ALREADY_COMPLETED: 'TSK_002',
		TASK_TEMPLATE_NOT_FOUND: 'TSK_003',
		INVALID_TASK_PROGRESS: 'TSK_004',
	},

	// Ошибки событий
	EVENT: {
		EVENT_NOT_FOUND: 'EVT_001',
		EVENT_ALREADY_ACTIVE: 'EVT_002',
		EVENT_TEMPLATE_NOT_FOUND: 'EVT_003',
		EVENT_EXPIRED: 'EVT_004',
	},

	// Ошибки пакетов
	PACKAGE: {
		PACKAGE_NOT_FOUND: 'PKG_001',
		PACKAGE_ALREADY_PURCHASED: 'PKG_002',
		PACKAGE_TEMPLATE_NOT_FOUND: 'PKG_003',
		PACKAGE_EXPIRED: 'PKG_004',
	},

	// Системные ошибки
	SYSTEM: {
		DATABASE_ERROR: 'SYS_001',
		INTERNAL_SERVER_ERROR: 'SYS_002',
		SERVICE_UNAVAILABLE: 'SYS_003',
		RATE_LIMIT_EXCEEDED: 'SYS_004',
		MAINTENANCE_MODE: 'SYS_005',
		CONFIGURATION_ERROR: 'SYS_006',
	},

	// Ошибки внешних сервисов
	EXTERNAL: {
		TON_API_ERROR: 'EXT_001',
		TELEGRAM_API_ERROR: 'EXT_002',
		PAYMENT_GATEWAY_ERROR: 'EXT_003',
		EXTERNAL_SERVICE_UNAVAILABLE: 'EXT_004',
	},
};

// Описания ошибок для разработчиков
const ERROR_DESCRIPTIONS = {
	// Аутентификация
	AUTH_001: 'User not found in the system',
	AUTH_002: 'User with this ID already exists',
	AUTH_003: 'Invalid authentication token provided',
	AUTH_004: 'Authentication token has expired',
	AUTH_005: 'User does not have sufficient permissions for this action',
	AUTH_006: 'Telegram authentication failed',
	AUTH_007: 'User account is blocked',

	// Валидация
	VAL_001: 'Invalid username format',
	VAL_002: 'Invalid referral code format',
	VAL_003: 'Invalid galaxy data provided',
	VAL_004: 'Invalid offer data provided',
	VAL_005: 'Missing required fields in request',
	VAL_006: 'Invalid galaxy seed format',
	VAL_007: 'Invalid price format',
	VAL_008: 'Invalid currency specified',

	// Галактики
	GAL_001: 'Galaxy not found',
	GAL_002: 'Galaxy with this seed already exists',
	GAL_003: 'Duplicate galaxy seed detected',
	GAL_004: 'Invalid galaxy properties provided',
	GAL_005: 'Galaxy is not owned by the user',
	GAL_006: 'Insufficient stars for this operation',
	GAL_007: 'Failed to create galaxy',

	// Маркет
	MKT_001: 'Market offer not found',
	MKT_002: 'Market offer already exists',
	MKT_003: 'Insufficient funds for transaction',
	MKT_004: 'Transaction failed to complete',
	MKT_005: 'Invalid offer type specified',
	MKT_006: 'Market offer has expired',
	MKT_007: 'Payment processing failed',

	// Артефакты
	ART_001: 'Artifact not found',
	ART_002: 'Artifact already exists',
	ART_003: 'Invalid artifact template',
	ART_004: 'Artifact is not owned by the user',
	ART_005: 'Artifact is not tradable',

	// Пользовательское состояние
	USR_001: 'User state not found',
	USR_002: 'Failed to create user state',
	USR_003: 'Insufficient resources for operation',
	USR_004: 'Daily bonus already claimed today',
	USR_005: 'Failed to update user streak',

	// Апгрейды
	UPG_001: 'Upgrade not found',
	UPG_002: 'Upgrade already completed',
	UPG_003: 'Insufficient progress for upgrade',
	UPG_004: 'Upgrade template not found',
	UPG_005: 'Maximum upgrade level reached',

	// Задачи
	TSK_001: 'Task not found',
	TSK_002: 'Task already completed',
	TSK_003: 'Task template not found',
	TSK_004: 'Invalid task progress',

	// События
	EVT_001: 'Event not found',
	EVT_002: 'Event already active',
	EVT_003: 'Event template not found',
	EVT_004: 'Event has expired',

	// Пакеты
	PKG_001: 'Package not found',
	PKG_002: 'Package already purchased',
	PKG_003: 'Package template not found',
	PKG_004: 'Package has expired',

	// Системные
	SYS_001: 'Database operation failed',
	SYS_002: 'Internal server error occurred',
	SYS_003: 'Service temporarily unavailable',
	SYS_004: 'Rate limit exceeded',
	SYS_005: 'System is in maintenance mode',
	SYS_006: 'Configuration error',

	// Внешние сервисы
	EXT_001: 'TON API service error',
	EXT_002: 'Telegram API service error',
	EXT_003: 'Payment gateway error',
	EXT_004: 'External service unavailable',
};

// Уровни серьезности ошибок
const ERROR_SEVERITY = {
	LOW: 'LOW',
	MEDIUM: 'MEDIUM',
	HIGH: 'HIGH',
	CRITICAL: 'CRITICAL',
};

// Маппинг кодов ошибок на уровни серьезности
const ERROR_SEVERITY_MAPPING = {
	// Аутентификация
	AUTH_001: ERROR_SEVERITY.MEDIUM,
	AUTH_002: ERROR_SEVERITY.LOW,
	AUTH_003: ERROR_SEVERITY.MEDIUM,
	AUTH_004: ERROR_SEVERITY.MEDIUM,
	AUTH_005: ERROR_SEVERITY.HIGH,
	AUTH_006: ERROR_SEVERITY.HIGH,
	AUTH_007: ERROR_SEVERITY.HIGH,

	// Валидация
	VAL_001: ERROR_SEVERITY.LOW,
	VAL_002: ERROR_SEVERITY.LOW,
	VAL_003: ERROR_SEVERITY.MEDIUM,
	VAL_004: ERROR_SEVERITY.MEDIUM,
	VAL_005: ERROR_SEVERITY.LOW,
	VAL_006: ERROR_SEVERITY.LOW,
	VAL_007: ERROR_SEVERITY.LOW,
	VAL_008: ERROR_SEVERITY.LOW,

	// Галактики
	GAL_001: ERROR_SEVERITY.MEDIUM,
	GAL_002: ERROR_SEVERITY.HIGH,
	GAL_003: ERROR_SEVERITY.HIGH,
	GAL_004: ERROR_SEVERITY.MEDIUM,
	GAL_005: ERROR_SEVERITY.MEDIUM,
	GAL_006: ERROR_SEVERITY.MEDIUM,
	GAL_007: ERROR_SEVERITY.HIGH,

	// Маркет
	MKT_001: ERROR_SEVERITY.MEDIUM,
	MKT_002: ERROR_SEVERITY.MEDIUM,
	MKT_003: ERROR_SEVERITY.MEDIUM,
	MKT_004: ERROR_SEVERITY.HIGH,
	MKT_005: ERROR_SEVERITY.MEDIUM,
	MKT_006: ERROR_SEVERITY.LOW,
	MKT_007: ERROR_SEVERITY.HIGH,

	// Артефакты
	ART_001: ERROR_SEVERITY.MEDIUM,
	ART_002: ERROR_SEVERITY.MEDIUM,
	ART_003: ERROR_SEVERITY.MEDIUM,
	ART_004: ERROR_SEVERITY.MEDIUM,
	ART_005: ERROR_SEVERITY.LOW,

	// Пользовательское состояние
	USR_001: ERROR_SEVERITY.HIGH,
	USR_002: ERROR_SEVERITY.HIGH,
	USR_003: ERROR_SEVERITY.MEDIUM,
	USR_004: ERROR_SEVERITY.LOW,
	USR_005: ERROR_SEVERITY.MEDIUM,

	// Апгрейды
	UPG_001: ERROR_SEVERITY.MEDIUM,
	UPG_002: ERROR_SEVERITY.LOW,
	UPG_003: ERROR_SEVERITY.MEDIUM,
	UPG_004: ERROR_SEVERITY.MEDIUM,
	UPG_005: ERROR_SEVERITY.LOW,

	// Задачи
	TSK_001: ERROR_SEVERITY.MEDIUM,
	TSK_002: ERROR_SEVERITY.LOW,
	TSK_003: ERROR_SEVERITY.MEDIUM,
	TSK_004: ERROR_SEVERITY.MEDIUM,

	// События
	EVT_001: ERROR_SEVERITY.MEDIUM,
	EVT_002: ERROR_SEVERITY.LOW,
	EVT_003: ERROR_SEVERITY.MEDIUM,
	EVT_004: ERROR_SEVERITY.LOW,

	// Пакеты
	PKG_001: ERROR_SEVERITY.MEDIUM,
	PKG_002: ERROR_SEVERITY.LOW,
	PKG_003: ERROR_SEVERITY.MEDIUM,
	PKG_004: ERROR_SEVERITY.LOW,

	// Системные
	SYS_001: ERROR_SEVERITY.CRITICAL,
	SYS_002: ERROR_SEVERITY.CRITICAL,
	SYS_003: ERROR_SEVERITY.HIGH,
	SYS_004: ERROR_SEVERITY.MEDIUM,
	SYS_005: ERROR_SEVERITY.HIGH,
	SYS_006: ERROR_SEVERITY.CRITICAL,

	// Внешние сервисы
	EXT_001: ERROR_SEVERITY.HIGH,
	EXT_002: ERROR_SEVERITY.HIGH,
	EXT_003: ERROR_SEVERITY.HIGH,
	EXT_004: ERROR_SEVERITY.HIGH,
};

module.exports = {
	ERROR_CODES,
	ERROR_DESCRIPTIONS,
	ERROR_SEVERITY,
	ERROR_SEVERITY_MAPPING,
};
