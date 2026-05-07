# MySQL Benchmark Setup Guide for GadgetRentalHub

## 🔧 What Was Fixed

### **Before (❌ Single Connection - Not Suitable for Benchmarking)**
```javascript
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "...",
    database: "gadget_rental"
});
```

**Problems:**
- Only ONE connection available
- Queries queue up if concurrent requests arrive
- No connection pooling
- High latency under load
- Not suitable for benchmarking real performance

### **After (✅ Connection Pool - Production Ready)**
```javascript
const db = mysql.createPool({
    connectionLimit: 10,           // 10 concurrent connections
    host: "localhost",
    user: "root",
    password: "...",
    database: "gadget_rental",
    waitForConnections: true,      // Queue requests if needed
    queueLimit: 0,                 // Unlimited queue size
    enableKeepAlive: true,         // Maintain idle connections
    keepAliveInitialDelayMs: 0,    // Immediate keepalive
    timeout: 30000                 // 30 second timeout
});
```

**Benefits:**
- 10 concurrent connections (adjustable)
- Better handling of simultaneous requests
- Automatic connection reuse (faster)
- Proper error recovery
- Ideal for benchmarking real scenarios

---

## 🎯 MySQL Configuration for Benchmarking

### **Step 1: Check Current MySQL Configuration**
```bash
mysql -u root -p
> SHOW VARIABLES LIKE '%max_connections%';
> SHOW VARIABLES LIKE '%wait_timeout%';
```

### **Step 2: Optimize MySQL for Better Performance**

Add these settings to `my.ini` (Windows) or `my.cnf` (Linux/Mac):

```ini
[mysqld]
# Connection pool settings
max_connections=100
max_allowed_packet=64M
connect_timeout=10
read_timeout=30
write_timeout=30

# Performance tuning
query_cache_size=0
query_cache_type=OFF
tmp_table_size=32M
max_heap_table_size=32M

# InnoDB settings (for better concurrency)
default-storage-engine=InnoDB
innodb_buffer_pool_size=512M
innodb_log_file_size=100M
innodb_flush_log_at_trx_commit=2

# Connection pooling
thread_stack=262144
```

### **Step 3: Restart MySQL to Apply Changes**
```bash
# Windows
net stop MySQL80
net start MySQL80

# Linux
sudo systemctl restart mysql

# macOS
brew services restart mysql
```

### **Step 4: Verify Settings Applied**
```bash
mysql -u root -p
> SHOW VARIABLES LIKE 'max_connections';
> SHOW VARIABLES LIKE 'innodb%';
```

---

## 📊 Run the Benchmark

### **Test 1: Simple Connection Test**
```bash
node inspect_schema.js
```
Expected output:
```
✅ MySQL Connection Pool Established (10 connections available).
✅ Gadgets table is ready.
✅ Inserted 4 sample gadget records.
```

### **Test 2: Full Benchmark Suite**
```bash
node benchmark.js
```

Expected output:
```
📊 Test 1: Connection Pool Health Check
✅ Connection acquired from pool
✅ Query executed successfully

📊 Test 2: Query Performance (Single Query)
✅ Query completed in 2.45ms
   Total gadgets: 4

📊 Test 3: Concurrent Queries (20 queries)
✅ All 20 queries completed
   Total time: 45.67ms
   Average per query: 2.28ms
   Errors: 0
   Success rate: 100.0%

📊 Test 4: Connection Pool Stress Test
✅ Stress test completed
   Max concurrent connections: 10/10 pool size
   Connection queueing: Yes ✓

📊 Test 5: Prepared Statements Performance
✅ Prepared statement executed in 1.89ms
   Results found: 1
```

### **Test 3: Run Main Server and Monitor**
```bash
node server.js
```

Expected output:
```
✅ MySQL Connection Pool Established (10 connections available).
✅ Gadgets table is ready.
✅ Inserted 4 sample gadget records.
Server is running on port 3000
```

---

## 🚀 Performance Metrics to Monitor

| Metric | Good | Acceptable | Poor |
|--------|------|-----------|------|
| **Query Time** | < 5ms | 5-20ms | > 20ms |
| **Concurrent Requests** | 10+ | 5-10 | < 5 |
| **Success Rate** | 100% | 95-100% | < 95% |
| **Connection Wait** | 0ms | < 10ms | > 50ms |
| **Pool Efficiency** | > 90% | 70-90% | < 70% |

---

## 🎓 Best Practices for Benchmarking

### **1. Use Prepared Statements** ✓
```javascript
// Good - Safe and Benchmarkable
db.query('SELECT * FROM Gadgets WHERE gadget_id = ?', [id], callback);
```

### **2. Always Release Connections**
```javascript
// With getConnection
db.getConnection((err, connection) => {
    if (connection) connection.release();
});

// Automatic with pool.query()
db.query(sql, params, callback); // Automatically released
```

### **3. Set Connection Limits Based on Load**
```javascript
// For low traffic
connectionLimit: 5

// For medium traffic (recommended)
connectionLimit: 10

// For high traffic
connectionLimit: 20-50
```

### **4. Monitor Connection Pool Status**
```javascript
// Add this to server.js to monitor
setInterval(() => {
    console.log(`✅ Active connections: ${db._allConnections?.length || 'N/A'}`);
}, 60000); // Every 60 seconds
```

### **5. Use Connection Timeouts**
```javascript
timeout: 30000  // 30 seconds before timeout
```

---

## ❌ Common Issues & Fixes

### **Issue: "PROTOCOL_CONNECTION_LOST"**
**Cause:** Single connection broke  
**Fix:** Already fixed! Using connection pool with automatic recovery

### **Issue: "ER_CON_COUNT_ERROR"**
**Cause:** Too many connections (need to increase limit)  
**Fix:**
```javascript
connectionLimit: 50  // Increase from 10
```

### **Issue: High Latency/Slow Queries**
**Cause:** Single connection bottleneck  
**Fix:** Already fixed! Connection pool handles multiple simultaneous queries

### **Issue: "Queries Queue Up"**
**Cause:** No connection pooling  
**Fix:** Already fixed! Pool with `waitForConnections: true` handles queueing

---

## 📈 Performance Testing Commands

### **Test 1: Simple Load Test (10 concurrent requests)**
```bash
node benchmark.js
```

### **Test 2: Database Size Check**
```bash
mysql -u root -p -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb FROM information_schema.tables WHERE table_schema='gadget_rental';"
```

### **Test 3: Slow Query Log**
```bash
mysql -u root -p -e "SET GLOBAL slow_query_log = 'ON'; SET GLOBAL long_query_time = 2;"
```

### **Test 4: Connection Pool Statistics**
```bash
mysql -u root -p -e "SHOW PROCESSLIST;"
```

---

## ✅ Verification Checklist

- [ ] Connection pool has 10 connections available
- [ ] Benchmark tests all pass (100% success rate)
- [ ] Average query time < 5ms
- [ ] No connection timeout errors
- [ ] Concurrent queries execute in parallel
- [ ] Connection reuse working (watch pool stats)
- [ ] MySQL configured with proper timeouts
- [ ] InnoDB storage engine enabled

---

## 🔗 Next Steps

1. **Run Benchmark:** `node benchmark.js`
2. **Monitor Logs:** Check server.js output for errors
3. **Load Testing:** Use tools like Apache Bench or Artillery
   ```bash
   npm install -g artillery
   artillery quick --count 100 --num 1000 http://localhost:3000/api/gadgets
   ```
4. **Profile Database:** Use MySQL Workbench for query analysis

---

**Last Updated:** 2024  
**Status:** ✅ Connection Pool Active
