# Event Template Service JSON Response Changes

## Overview

Modified all methods in `event-template-service.js` to return JSON objects instead of Sequelize model instances. This ensures consistent data format and eliminates potential serialization issues.

## Changes Made

### 1. createEvents() Method

-   **Before**: Returned Sequelize model instances in array
-   **After**: Returns JSON objects using `event.toJSON()`

```javascript
// Before
createdEvents.push(event);

// After
createdEvents.push(event.toJSON());
```

### 2. updateEvent() Method

-   **Before**: Returned Sequelize model instance
-   **After**: Returns JSON object using `event.toJSON()`

```javascript
// Before
return event;

// After
return event.toJSON();
```

### 3. getAllEvents() Method

-   **Before**: Returned array of Sequelize model instances
-   **After**: Returns array of JSON objects using `map(event => event.toJSON())`

```javascript
// Before
return events;

// After
return events.map((event) => event.toJSON());
```

### 4. getEvent() Method

-   **Before**: Returned Sequelize model instance
-   **After**: Returns JSON object using `event.toJSON()`

```javascript
// Before
return event;

// After
return event.toJSON();
```

### 5. toggleEventActive() Method

-   **Before**: Returned Sequelize model instance
-   **After**: Returns JSON object using `event.toJSON()`

```javascript
// Before
return event;

// After
return event.toJSON();
```

## Benefits

### 1. Consistent Data Format

-   All API responses now return plain JavaScript objects
-   No Sequelize-specific properties or methods in responses
-   Predictable data structure for frontend consumption

### 2. Serialization Safety

-   Eliminates potential circular reference issues
-   No problems with JSON.stringify() on responses
-   Safe for API responses and caching

### 3. Frontend Compatibility

-   Direct compatibility with React state management
-   No need to handle Sequelize model methods
-   Cleaner data handling in components

### 4. API Consistency

-   All service methods follow the same pattern
-   Consistent response format across the application
-   Easier to maintain and debug

## Testing

Updated `test-event-find-or-create.js` to verify JSON responses:

### New Test Cases Added:

-   **Test 3.5**: Verifies `getAllEvents()` returns JSON array
-   **Test 6**: Verifies `getEvent()` returns JSON object
-   **Test 7**: Verifies `toggleEventActive()` returns JSON object

### Type Checking:

```javascript
console.log('   Type:', typeof result1.events[0]); // Should be 'object'
console.log('   Type:', typeof allEvents); // Should be 'object' (array)
console.log('   First event type:', typeof allEvents[0]); // Should be 'object' (JSON)
```

## Expected JSON Structure

All event template responses now follow this structure:

```json
{
	"id": 1,
	"slug": "event_slug",
	"name": "Event Name",
	"description": {
		"en": "English description",
		"ru": "Russian description"
	},
	"type": "RANDOM",
	"triggerConfig": {},
	"effect": {},
	"frequency": {},
	"conditions": {},
	"active": true,
	"createdAt": "2025-01-01T00:00:00.000Z",
	"updatedAt": "2025-01-01T00:00:00.000Z"
}
```

## Files Modified

1. **`nebulahunt-server/service/event-template-service.js`**

    - Added `.toJSON()` calls to all return statements
    - Added `.map(event => event.toJSON())` for array returns

2. **`nebulahunt-server/test-event-find-or-create.js`**

    - Added JSON response verification tests
    - Added type checking for all method responses

3. **`nebulahunt-server/EVENT_TEMPLATE_TRANSACTIONS_SUMMARY.md`**
    - Updated documentation to reflect JSON changes
    - Added new test cases to expected output

## Usage

### Running the Updated Test

```bash
node test-event-find-or-create.js
```

### Expected Output

```
📝 Test 1: Creating new event using findOrCreate...
✅ Created event: test_find_or_create
   Type: object

📝 Test 3.5: Testing getAllEvents JSON response...
✅ getAllEvents returned: X events
   Type: object
   First event type: object

📝 Test 6: Testing getEvent JSON response...
✅ getEvent returned event: Updated Test Multiple 1
   Type: object

📝 Test 7: Testing toggleEventActive JSON response...
✅ toggleEventActive returned event: Updated Test Multiple 1
   Active status: false
   Type: object
```

## Frontend Impact

The frontend components (`EventTemplatesTab.tsx`) will now receive:

-   Clean JSON objects instead of Sequelize models
-   No need for special handling of model methods
-   Direct compatibility with React state and props
-   Consistent data structure across all API calls

## Related Documentation

-   [Event Template Transactions Summary](./EVENT_TEMPLATE_TRANSACTIONS_SUMMARY.md)
-   [Event Templates Summary](./EVENT_TEMPLATES_SUMMARY.md)
-   [API Documentation](./docs/api.md)
