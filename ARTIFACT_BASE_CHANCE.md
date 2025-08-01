# Artifact Base Chance System

## Обзор

Поле `baseChance` добавлено в модель `ArtifactTemplate` для управления базовым шансом нахождения артефакта в игре.

## Структура поля

```javascript
baseChance: {
    type: DataTypes.FLOAT,
    defaultValue: 0.01,
    allowNull: false,
    comment: 'Base chance for this artifact to be found (0.0 to 1.0)',
}
```

## Значения

-   **Тип**: `FLOAT` (число с плавающей точкой)
-   **Диапазон**: от 0.0 до 1.0
-   **Значение по умолчанию**: 0.01 (1%)
-   **Обязательное поле**: Да

## Примеры значений

| Шанс  | Процент | Описание                             |
| ----- | ------- | ------------------------------------ |
| 0.001 | 0.1%    | Очень редкий (легендарные артефакты) |
| 0.01  | 1%      | Редкий (эпические артефакты)         |
| 0.02  | 2%      | Необычный (редкие артефакты)         |
| 0.03  | 3%      | Необычный (необычные артефакты)      |
| 0.05  | 5%      | Обычный (обычные артефакты)          |

## Миграция

Для добавления поля в существующую базу данных выполните:

```bash
npm run migrate
```

Файл миграции: `migrations/20250101000020-add-base-chance-to-artifact-templates.js`

## Использование в коде

### Создание артефакта с baseChance

```javascript
const artifact = await ArtifactTemplate.create({
	slug: 'my_artifact',
	name: 'My Artifact',
	baseChance: 0.025, // 2.5% шанс
	// ... другие поля
});
```

### Обновление baseChance

```javascript
await artifact.update({
	baseChance: 0.05, // 5% шанс
});
```

### API Endpoints

```javascript
// GET /api/artifact-templates - Получить все артефакты
// GET /api/artifact-templates/:slug - Получить артефакт по slug
// POST /api/artifact-templates - Создать артефакты
// PUT /api/artifact-templates/:slug - Обновить артефакт
// DELETE /api/artifact-templates/:slug - Удалить артефакт
```

### Получение артефактов с фильтрацией по шансу

```javascript
// Артефакты с шансом больше 2%
const rareArtifacts = await ArtifactTemplate.findAll({
	where: {
		baseChance: {
			[Op.gt]: 0.02,
		},
	},
});
```

## Frontend интеграция

### TypeScript интерфейс

```typescript
interface ArtifactTemplate {
	// ... другие поля
	baseChance?: number;
}
```

### Сортировка

Артефакты автоматически сортируются по `baseChance` в порядке возрастания (от редких к частым). Также доступна сортировка по:

-   **Base Chance** - по шансу нахождения (по умолчанию)
-   **Name** - по названию
-   **Rarity** - по редкости

В веб-интерфейсе доступны кнопки для переключения сортировки с индикаторами направления (↑↓).

### Отображение в UI

```typescript
// В процентах
const chancePercent = (artifact.baseChance * 100).toFixed(1) + '%';
```

## Примеры в JSON

```json
{
	"slug": "stardust_amplifier",
	"name": "Stardust Amplifier",
	"baseChance": 0.05,
	"rarity": "COMMON"
}
```

```json
{
	"slug": "cosmic_heart",
	"name": "Cosmic Heart",
	"baseChance": 0.001,
	"rarity": "LEGENDARY"
}
```

## Тестирование

Запустите тестовый скрипт:

```bash
node test-artifact-base-chance.js
```

Этот скрипт проверит:

-   Создание артефакта с baseChance
-   Обновление значения
-   Получение из базы данных
-   Отображение всех артефактов с их шансами

## Рекомендации по использованию

1. **Редкость артефактов**: Используйте baseChance в соответствии с редкостью артефакта
2. **Баланс игры**: Не делайте слишком много артефактов с высоким шансом
3. **Масштабирование**: Учитывайте общее количество артефактов при установке шансов
4. **Тестирование**: Регулярно тестируйте баланс шансов в игре

## Связанные файлы

-   `models/models.js` - Определение модели
-   `migrations/20250101000020-add-base-chance-to-artifact-templates.js` - Миграция
-   `nebulahunt-webclient/src/components/ArtifactTemplatesTab.tsx` - UI компонент
-   `nebulahunt-webclient/public/examples/artifact-templates-example.json` - Примеры
-   `test-artifact-base-chance.js` - Тестовый скрипт
