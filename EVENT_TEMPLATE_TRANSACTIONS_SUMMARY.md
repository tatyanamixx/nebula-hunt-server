# Event Template Service Transaction Improvements

## Overview

Improved the `event-template-service.js` to use proper transaction handling and replaced the `findOne` + `create` pattern with `findOrCreate` for better atomicity and performance.

## Changes Made

### 1. Fixed Missing Import

-   **File**: `nebulahunt-server/service/event-template-service.js`
-   **Change**: Added `sequelize` import from models

```javascript
const { EventTemplate, sequelize } = require('../models/models');
```

### 2. Replaced findOne + create with findOrCreate

-   **Method**: `createEvents()`
-   **Improvement**: Used `findOrCreate` for atomic operations with ID handling

```javascript
// Before: findOne + create pattern
let event = await EventTemplate.findOne({
	where: { slug: eventData.slug },
	transaction: t,
});

if (event) {
	await event.update(eventData, { transaction: t });
	createdEvents.push(event);
} else {
	event = await EventTemplate.create(eventData, { transaction: t });
	createdEvents.push(event);
}

// After: findOrCreate pattern with ID handling
const { id, ...eventDataWithoutId } = eventData;
const [event, created] = await EventTemplate.findOrCreate({
	where: { slug: eventData.slug },
	defaults: eventDataWithoutId,
	transaction: t,
});

if (!created) {
	await event.update(eventDataWithoutId, { transaction: t });
}

createdEvents.push(event);
```

### 3. Fixed Transaction Rollback Logic

-   **Problem**: `finally` block was always rolling back, even after successful commits
-   **Solution**: Moved rollback to `catch` block only

```javascript
// Before: Always rolled back
try {
	// ... operations
	await t.commit();
} catch (err) {
	// ... error handling
} finally {
	await t.rollback(); // ❌ Always rolled back!
}

// After: Only rollback on error
try {
	// ... operations
	await t.commit();
} catch (err) {
	await t.rollback(); // ✅ Only on error
	// ... error handling
}
```

### 4. Removed Unnecessary Transactions

-   **Methods**: `getAllEvents()`, `getEvent()`
-   **Reason**: Read-only operations don't need transactions
-   **Benefit**: Better performance and simpler code

### 5. Fixed Missing Transaction Parameter

-   **Method**: `deleteEvent()`
-   **Fix**: Added transaction to `destroy()` call

```javascript
await event.destroy({ transaction: t });
```

### 6. Fixed ID Auto-Increment Issues

-   **Methods**: `createEvents()`, `updateEvent()`
-   **Problem**: Explicit `id` values in data could conflict with auto-increment
-   **Solution**: Remove `id` field from data before database operations

```javascript
// Remove id from eventData to avoid conflicts with auto-increment
const { id, ...eventDataWithoutId } = eventData;
```

## Benefits

### 1. Atomicity

-   `findOrCreate` ensures that the find and create operations are atomic
-   No race conditions between checking existence and creating

### 2. Performance

-   Reduced database round trips
-   Removed unnecessary transactions for read operations

### 3. Reliability

-   Proper transaction rollback only on errors
-   Consistent error handling across all methods

### 4. Code Quality

-   Cleaner, more maintainable code
-   Better separation of concerns

### 5. Data Consistency

-   All methods return JSON objects instead of Sequelize model instances
-   Consistent data format across all API responses
-   No issues with model serialization or circular references

## Testing

Created `test-event-find-or-create.js` to verify:

-   ✅ Creating new events with `findOrCreate`
-   ✅ Updating existing events with `findOrCreate`
-   ✅ Multiple event creation/update
-   ✅ Database consistency
-   ✅ Proper cleanup
-   ✅ JSON response format for all methods
-   ✅ Type checking for returned data

Created `test-event-id-fix.js` to verify:

-   ✅ ID auto-increment handling
-   ✅ Explicit ID values are ignored
-   ✅ Update operations preserve auto-generated IDs

## Usage

### Running the Test

```bash
node test-event-find-or-create.js
```

### Expected Output

```
🧪 Testing Event Template findOrCreate functionality...

📝 Test 1: Creating new event using findOrCreate...
✅ Created event: test_find_or_create
   Type: object

📝 Test 2: Trying to create the same event again...
✅ Updated event: test_find_or_create

📝 Test 3: Verifying event in database...
✅ Event found in database

📝 Test 3.5: Testing getAllEvents JSON response...
✅ getAllEvents returned: X events
   Type: object
   First event type: object

📝 Test 4: Testing with multiple events...
✅ Created/Updated multiple events: 2

📝 Test 5: Updating one of the multiple events...
✅ Updated event: Updated Test Multiple 1

📝 Test 6: Testing getEvent JSON response...
✅ getEvent returned event: Updated Test Multiple 1
   Type: object

📝 Test 7: Testing toggleEventActive JSON response...
✅ toggleEventActive returned event: Updated Test Multiple 1
   Active status: false
   Type: object

🧹 Cleaning up test data...
   ✅ Deleted: test_find_or_create
   ✅ Deleted: test_multiple_1
   ✅ Deleted: test_multiple_2

🎉 Event Template findOrCreate testing completed successfully!
```

## Files Modified

1. **`nebulahunt-server/service/event-template-service.js`**

    - Fixed imports
    - Replaced findOne + create with findOrCreate
    - Fixed transaction rollback logic
    - Removed unnecessary transactions
    - Added missing transaction parameters
    - **All methods now return JSON objects instead of Sequelize models**
    - **Fixed ID auto-increment issues by removing explicit ID values**

2. **`nebulahunt-server/test-event-find-or-create.js`** (new)

    - Comprehensive test script for findOrCreate functionality
    - Tests creation, updates, multiple events, and cleanup
    - **Added JSON response format verification**

3. **`nebulahunt-server/test-event-id-fix.js`** (new)
    - Test script for ID auto-increment handling
    - Verifies explicit ID values are properly ignored

## Next Steps

1. Run the test script to verify functionality:

    ```bash
    node test-event-find-or-create.js
    ```

2. Test the Event Templates tab in the web interface:

    - Navigate to Game Settings → Events
    - Create new events
    - Import JSON files
    - Update existing events
    - Toggle event status

3. Monitor server logs for any transaction-related errors

## Related Documentation

-   [Event Templates Summary](./EVENT_TEMPLATES_SUMMARY.md)
-   [API Documentation](./docs/api.md)
-   [Database Models](./models/models.js)
