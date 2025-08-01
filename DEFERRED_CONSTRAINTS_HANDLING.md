# Deferred Constraints Handling in User Registration

## Overview

This document explains how deferred constraints are properly handled during transaction completion in the user registration system.

## What are Deferred Constraints?

Deferred constraints in PostgreSQL allow foreign key and other constraint checks to be postponed until the end of a transaction. This is useful when you need to insert data in a specific order that might temporarily violate constraints, but will be valid once all data is inserted.

## How It Works

### 1. Setting Constraints to Deferred

At the beginning of a transaction, we set all constraints to deferred:

```sql
SET CONSTRAINTS ALL DEFERRED;
```

This allows us to:
- Insert user data first
- Insert related data (UserState, Galaxy, etc.) that references the user
- Insert upgrade trees, events, tasks, etc. that reference the user
- All constraint violations are postponed until commit

### 2. Constraint Validation During Commit

When the transaction commits, PostgreSQL automatically validates all deferred constraints:

```javascript
// Constraints are automatically checked during commit
await transaction.commit();
```

If any constraints are violated, the commit fails and the entire transaction is rolled back.

### 3. Setting Constraints Back to Immediate (Before Commit)

For consistency and to ensure constraints are checked immediately after commit, we set them back to immediate:

```javascript
// Set constraints back to immediate before commit
await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE', {
    transaction,
});

// Then commit
await transaction.commit();
```

## Implementation in User Registration

### Registration Method

```javascript
async registration(userId, username, referral, galaxy) {
    const transaction = await sequelize.transaction();
    try {
        // 1. Set constraints to deferred at the start
        await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
            transaction,
        });

        // 2. Create user and all related data
        const [user, created] = await User.findOrCreate({...});
        const [userState, createdUserState] = await UserState.findOrCreate({...});
        // ... more operations

        // 3. Set constraints back to immediate before commit
        await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE', {
            transaction,
        });

        // 4. Commit (constraints are validated here)
        await transaction.commit();

        return response;
    } catch (err) {
        // 5. Rollback on error
        if (!transaction.finished) {
            await transaction.rollback();
        }
        throw err;
    }
}
```

### Login Method

```javascript
async login(userId) {
    const transaction = await sequelize.transaction();
    try {
        // 1. Set constraints to deferred
        await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
            transaction,
        });

        // 2. Perform operations that might create related data
        // (initialization of upgrades, tasks, etc.)

        // 3. Set constraints back to immediate before commit
        await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE', {
            transaction,
        });

        // 4. Commit
        await transaction.commit();

        return response;
    } catch (err) {
        if (!transaction.finished) await transaction.rollback();
        throw err;
    }
}
```

## Benefits

1. **Data Consistency**: Ensures all related data is created atomically
2. **Error Handling**: If any constraint is violated, the entire operation is rolled back
3. **Flexibility**: Allows complex data insertion patterns that would otherwise fail
4. **Performance**: Reduces the number of constraint checks during the transaction

## Testing

Use the test script to verify deferred constraints handling:

```bash
node test-deferred-constraints.js
```

This script tests:
- Successful registration with deferred constraints
- Successful login with deferred constraints
- Error handling for constraint violations
- Transaction atomicity verification

## Common Issues and Solutions

### Issue: Constraints checked after commit
**Problem**: Trying to set constraints to immediate after commit
```javascript
await transaction.commit();
await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE', { transaction }); // ❌ Wrong
```

**Solution**: Set constraints to immediate before commit
```javascript
await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE', { transaction }); // ✅ Correct
await transaction.commit();
```

### Issue: Duplicate SET CONSTRAINTS ALL DEFERRED
**Problem**: Multiple services setting constraints to deferred
**Solution**: Only set constraints to deferred in the main transaction, not in nested service calls

### Issue: Missing constraint validation
**Problem**: Not setting constraints back to immediate
**Solution**: Always set constraints back to immediate before commit to ensure validation

## Best Practices

1. **Always set constraints to deferred at the start** of complex transactions
2. **Always set constraints back to immediate before commit**
3. **Never set constraints after commit** (transaction is finished)
4. **Handle rollbacks properly** in catch blocks
5. **Test constraint handling** with various scenarios
6. **Document constraint handling** in service methods

## Related Files

- `service/user-service.js` - Main registration and login logic
- `service/game-service.js` - Galaxy creation with deferred constraints
- `test-deferred-constraints.js` - Test script for constraint handling
- `TRANSACTION_CORRECTNESS_FIXES.md` - Previous transaction fixes 