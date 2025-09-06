# Closure Factory Pattern - Data Access Layer

## 📋 Overview

This project uses the **Closure Factory Pattern** in the data access layer (`src/db/dataAccess.js`) to optimize SQLite query performance and architecture.

## 🏭 Pattern Explained

### Pattern Structure

```javascript
function createInsertDevice(db) {              // ← Factory Function
  const stmt = db.prepare(`INSERT INTO...`);  // ← Closure Capture (expensive)
  
  return function insertDevice(deviceData) {  // ← Returned Function
    return stmt.run(deviceData);              // ← Uses captured statement (fast)
  };
}
```

### Alternative Names
- **Closure Factory Pattern**
- **Prepared Statement Factory**
- **Function Factory with Closure**
- **Currying with Resource Capture**

## 🎯 Why This Pattern?

### 1. **Optimized SQLite Performance**

SQLite has two distinct phases for query execution:

```javascript
// ❌ ANTI-PATTERN - Slow
function insertDevice(db, deviceData) {
  const stmt = db.prepare(`INSERT...`);  // 🐌 SQL parsing on every call
  return stmt.run(deviceData);           // ⚡ Fast execution
}

// ✅ CLOSURE FACTORY - Fast  
function createInsertDevice(db) {
  const stmt = db.prepare(`INSERT...`);  // 🐌 SQL parsing once
  return function(deviceData) {
    return stmt.run(deviceData);         // ⚡ Fast execution N times
  };
}
```

### 2. **Preparation/Execution Separation**

| Phase | Cost | Frequency | Factory Pattern |
|-------|------|-----------|-----------------|
| **Preparation** | 🐌 High | Once | Factory creation |
| **Execution** | ⚡ Low | N times | Function calls |

### 3. **Encapsulation and Security**

```javascript
const dataAccess = createDataAccess(db);

// ✅ Clean interface - no direct access to db or statements
await dataAccess.insertDevice({ device_id: 'abc123' });

// ❌ Impossible to accidentally access:
// - dataAccess.db (doesn't exist)
// - dataAccess.stmt (encapsulated in closure)
```

## 🏗️ Complete Architecture

### Layer Structure

```
Repository Layer    →  Business Logic (Phase 4)
       ↓
Data Access Layer   →  SQL Operations (Phase 3) ← CLOSURE FACTORY
       ↓  
Database Layer      →  Connection & Schema (Phase 2)
```

### Usage Example

```javascript
// Phase 2: Database initialization
const db = initDb('./data.sqlite');

// Phase 3: Data Access creation (preparation)
const dataAccess = createDataAccess(db);  // ← Prepare all statements

// Runtime: Fast execution
await dataAccess.insertDevice(device1);   // ← Execute (fast)
await dataAccess.insertDevice(device2);   // ← Execute (fast) 
await dataAccess.insertDevice(device3);   // ← Execute (fast)
```

## 💡 Detailed Advantages

### 🚀 **Performance**
- **SQL parsing once** instead of N times
- **Pre-compiled statements** reusable
- **SQLite optimization** maximized

### 🔒 **Encapsulation**
- Variables `db` and `stmt` **private** in closure
- **Clean public interface** without implementation details
- **No memory leaks** from DB references

### 🧩 **Composition**
- **Modular factories** easy to test
- **Simple assembly** into dataAccess object
- **Reusability** in different contexts

### 🛡️ **Security**
- **Prepared statements** prevent SQL injection
- **Typed and validated** parameters
- **No direct access** to DB objects

## 📊 Comparison with Other Patterns

### Class-Based Pattern
```javascript
// ❌ More verbose, less performant
class DeviceDataAccess {
  constructor(db) {
    this.db = db;
    this.insertStmt = db.prepare(`INSERT...`);
  }
  
  insertDevice(data) {
    return this.insertStmt.run(data);
  }
}
```

### Object-Based Pattern
```javascript
// ❌ Indirect access, less optimized
function createDataAccess(db) {
  const statements = {
    insert: db.prepare(`INSERT...`),
    find: db.prepare(`SELECT...`)
  };
  
  return {
    insertDevice(data) {
      return statements.insert.run(data);  // Indirection
    }
  };
}
```

### Closure Factory Pattern
```javascript
// ✅ Direct, optimized, encapsulated
function createInsertDevice(db) {
  const stmt = db.prepare(`INSERT...`);
  return (data) => stmt.run(data);  // Direct access
}
```

## 🔧 Implementation in Project

### Affected Files

- **`src/db/dataAccess.js`** - Pattern implementation
- **`test/dataAccess.test.js`** - Validation tests
- **`src/db/index.js`** - DB initialization (Phase 2)

### Available Factory Functions

| Factory | Operation | Usage |
|---------|-----------|-------|
| `createInsertDevice` | INSERT device | New device |
| `createFindDeviceById` | SELECT device | Search by ID |
| `createUpdateDeviceLastSeen` | UPDATE device | Timestamp update |
| `createInsertRoom` | INSERT room | New room |
| `createFindRoomById` | SELECT room | Room search |
| `createInsertReading` | INSERT reading | New measurement |
| `createFindLatestReadingByDevice` | SELECT reading | Latest measurement |
| `createFindReadingsByRoomAndTimeRange` | SELECT readings | Time-based query |

## 🧪 Testing and Validation

### Test Structure
```javascript
describe('Data Access Layer', () => {
  let db, dataAccess;
  
  beforeEach(() => {
    db = initDb(':memory:');
    dataAccess = createDataAccess(db);  // ← Pattern in action
  });
  
  it('should insert device efficiently', () => {
    // Test that factory works
    const result = dataAccess.insertDevice(deviceData);
    expect(result.changes).toBe(1);
  });
});
```

### Performance Metrics
- **8 tests** passing in ~22ms
- **Prepared statements** once per test
- **Multiple executions** without re-parsing

## 📈 Measurable Benefits

### Before (without pattern)
```javascript
// N calls = N preparations + N executions
insertDevice(db, data1);  // Parse + Execute
insertDevice(db, data2);  // Parse + Execute  
insertDevice(db, data3);  // Parse + Execute
// Total: 3 × (Parse + Execute)
```

### After (with pattern)
```javascript
// 1 preparation + N executions
const insert = createInsertDevice(db);  // Parse once
insert(data1);  // Execute only
insert(data2);  // Execute only
insert(data3);  // Execute only
// Total: 1 × Parse + 3 × Execute
```

### Performance Gains
- **SQL parsing reduction**: -66% for 3 calls
- **SQL parsing reduction**: -90% for 10 calls
- **SQL parsing reduction**: -99% for 100 calls

## 🎓 Lessons Learned

### ✅ Best Practices
1. **Separate preparation and execution** for expensive resources
2. **Use closures** to encapsulate private state
3. **Compose factories** into coherent interfaces
4. **Test the pattern** with real data

### ⚠️ Attention Points
1. **Memory**: Closures keep references (usually OK)
2. **Debugging**: Stack traces with closures (generally OK)
3. **Complexity**: More functions to maintain (justified by gains)

## 🔗 References

- [SQLite Prepared Statements](https://www.sqlite.org/c3ref/prepare.html)
- [JavaScript Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [Function Factories](https://www.patterns.dev/posts/factory-pattern/)
- [better-sqlite3 Performance](https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/performance.md)

---

**Note**: This pattern is particularly well-suited for SQLite databases where statement preparation is expensive and reuse is critical for performance.
