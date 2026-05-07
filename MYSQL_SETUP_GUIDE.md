# MySQL Benchmark Configuration & Setup

## 📋 Pre-Benchmark Checklist

### **1. MySQL Service Status**
```bash
# Windows
net start MySQL80

# Linux
sudo systemctl start mysql

# macOS
brew services start mysql
```

✅ Verify: `mysql -u root -p -e "SELECT 1;"`

---

## 🛠️ MySQL Configuration for Benchmarking

### **Step 1: Locate MySQL Configuration File**

**Windows:**
```
C:\ProgramData\MySQL\MySQL Server 8.0\my.ini
```

**Linux:**
```
/etc/mysql/my.cnf
/etc/mysql/mysql.conf.d/mysqld.cnf
```

**macOS:**
```
/usr/local/etc/my.cnf
/opt/homebrew/etc/my.cnf
```

### **Step 2: Add Benchmark-Friendly Settings**

Open the configuration file and add these under `[mysqld]`:

```ini
[mysqld]
# ===== CONNECTION SETTINGS =====
max_connections=200
max_allowed_packet=256M
connect_timeout=10
interactive_timeout=3600
wait_timeout=3600

# ===== QUERY SETTINGS =====
query_cache_type=OFF
query_cache_size=0
tmp_table_size=64M
max_heap_table_size=64M

# ===== INNODB SETTINGS (Best for Benchmarking) =====
default-storage-engine=InnoDB
innodb_buffer_pool_size=1G
innodb_log_file_size=256M
innodb_flush_log_at_trx_commit=2
innodb_flush_method=O_DIRECT
innodb_file_per_table=ON

# ===== PERFORMANCE SETTINGS =====
sort_buffer_size=2M
read_rnd_buffer_size=2M
bulk_insert_buffer_size=16M

# ===== LOGGING (Disable for Speed) =====
general_log=OFF
log_queries_not_using_indexes=OFF
slow_query_log=OFF

# ===== BINLOG (Optional for Benchmarking) =====
# skip-log-bin
binlog_format=ROW
```

### **Step 3: Restart MySQL**

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
mysql -u root -p -e "
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'query_cache%';
SHOW VARIABLES LIKE 'innodb%';
"
```

---

## 📊 Pre-Benchmark Diagnostics

### **Check MySQL Health**
```bash
mysql -u root -p -e "
SELECT VERSION();
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS\G
"
```

### **Check Table Status**
```bash
mysql -u root -p gadget_rental -e "
SELECT table_name, engine, table_rows, 
       ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables 
WHERE table_schema='gadget_rental';
"
```

### **Expected Output:**
```
| table_name | engine | table_rows | size_mb |
|------------|--------|------------|---------|
| Gadgets    | InnoDB | 4          | 0.02    |
| ...        | ...    | ...        | ...     |
```

---

## 🎯 Create Benchmark Tables (Optional)

For more realistic benchmarking with more data:

```bash
mysql -u root -p gadget_rental << 'EOF'

-- Create a larger dataset for benchmarking
DROP TABLE IF EXISTS Gadgets_Benchmark;

CREATE TABLE Gadgets_Benchmark (
    gadget_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Misc',
    daily_rate DECIMAL(10,2) DEFAULT 0,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    image_url LONGTEXT,
    description LONGTEXT,
    owner_name VARCHAR(100),
    owner_email VARCHAR(100),
    owner_phone VARCHAR(100),
    owner_contact VARCHAR(100),
    delivery_location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_owner_email (owner_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert 1000 sample records for realistic benchmarking
INSERT INTO Gadgets_Benchmark 
(name, category, daily_rate, deposit_amount, image_url, description, owner_name, owner_email, owner_phone, owner_contact, delivery_location, status)
SELECT
    CONCAT('Gadget-', @row:=@row+1),
    ELT(FLOOR(RAND()*5)+1, 'Electronics', 'Photography', 'Calculators', 'Components', 'Other'),
    FLOOR(50 + RAND() * 200),
    FLOOR(200 + RAND() * 500),
    'https://images.unsplash.com/photo-1517059224940-d4af9eec41e5?auto=format&fit=crop&w=800&q=80',
    CONCAT('Sample gadget for benchmarking ', @row),
    CONCAT('Owner ', @row),
    CONCAT('owner', @row, '@example.com'),
    CONCAT('9', FLOOR(RAND()*900000000 + 100000000)),
    CONCAT('owner', @row, '@example.com'),
    'Campus',
    ELT(FLOOR(RAND()*2)+1, 'Available', 'Available')
FROM (SELECT @row:=0) AS init
LIMIT 1000;

SELECT COUNT(*) AS total_records FROM Gadgets_Benchmark;
EOF
```

---

## 🔍 Enable Query Logging for Analysis

```bash
mysql -u root -p -e "
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.5;
SET GLOBAL log_queries_not_using_indexes = 'ON';
"
```

View slow queries:
```bash
# Linux/macOS
tail -f /var/log/mysql/slow.log

# Windows
type "C:\ProgramData\MySQL\MySQL Server 8.0\logs\slow.log"
```

---

## 📈 Benchmark Performance Targets

### **Acceptable Performance Metrics:**

| Metric | Good | Acceptable | Poor |
|--------|------|-----------|------|
| **Single Query** | < 1ms | 1-5ms | > 10ms |
| **10 Concurrent Queries** | < 10ms total | 10-50ms | > 100ms |
| **100 Queries** | < 200ms | 200-500ms | > 1s |
| **Connection Pool Hit** | < 0.5ms | 0.5-2ms | > 5ms |
| **Throughput** | > 1000 q/s | 100-1000 q/s | < 100 q/s |

---

## 🧪 Run Benchmarks

### **Test 1: Basic Connection**
```bash
node inspect_schema.js
```

### **Test 2: Full Benchmark Suite**
```bash
node benchmark.js
```

### **Test 3: Load Testing with Artillery**
```bash
# Install
npm install -g artillery

# Run
artillery quick --count 100 --num 1000 http://localhost:3000/api/gadgets
```

### **Test 4: Custom Benchmark**
```bash
mysql -u root -p gadget_rental << 'EOF'
-- Measure query performance
SELECT SQL_NO_CACHE COUNT(*) FROM Gadgets;
SELECT SQL_NO_CACHE * FROM Gadgets WHERE category='Electronics' LIMIT 10;
EOF
```

---

## 🔧 Tuning Based on Benchmarks

### **If Queries are Slow:**
1. Check indexes: `SHOW INDEX FROM Gadgets;`
2. Analyze query: `EXPLAIN SELECT ...;`
3. Add indexes: `ALTER TABLE Gadgets ADD INDEX idx_name (column_name);`

### **If Connections are Slow:**
1. Increase `max_connections` in MySQL config
2. Increase `connectionLimit` in Node.js: `connectionLimit: 20`
3. Check network: `mysql -u root -p -e "SELECT NOW();"`

### **If Throughput is Low:**
1. Enable InnoDB compression
2. Increase `innodb_buffer_pool_size`
3. Disable query cache (`query_cache_type=OFF`)
4. Reduce logging

---

## 📊 Monitor During Benchmark

### **Real-time Monitoring:**
```bash
mysql -u root -p gadget_rental -e "
SHOW PROCESSLIST;
" | watch -n 1
```

### **Performance Schema (MySQL 5.7+):**
```bash
mysql -u root -p -e "
SELECT * FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC LIMIT 10;
"
```

---

## ✅ Pre-Benchmark Verification

```bash
#!/bin/bash
echo "🔍 MySQL Benchmark Pre-Check"
echo "=============================="

# Check MySQL running
mysql -u root -p -e "SELECT 'MySQL: OK' AS status;" 2>/dev/null || echo "MySQL: FAILED"

# Check database exists
mysql -u root -p -e "USE gadget_rental; SELECT 'Database: OK' AS status;" 2>/dev/null || echo "Database: FAILED"

# Check table exists
mysql -u root -p gadget_rental -e "SELECT 'Table: OK' AS status FROM Gadgets LIMIT 1;" 2>/dev/null || echo "Table: FAILED"

# Check connection pool
node inspect_schema.js 2>/dev/null | grep "✅" && echo "Connection Pool: OK" || echo "Connection Pool: FAILED"

echo "=============================="
echo "Pre-check complete!"
```

---

## 🎯 Benchmark Workflow

1. **Configure MySQL** → Add optimization settings
2. **Restart MySQL** → Apply configuration changes
3. **Verify Setup** → Run `inspect_schema.js`
4. **Run Benchmark** → Run `benchmark.js`
5. **Analyze Results** → Review performance metrics
6. **Tune if Needed** → Adjust configuration
7. **Load Test** → Use Artillery for real-world testing
8. **Document** → Record baseline metrics

---

## 📞 Troubleshooting

**Q: "Too many connections" error?**  
A: Increase MySQL `max_connections` or Node.js `connectionLimit`

**Q: Queries slower than expected?**  
A: Check for missing indexes: `SHOW INDEX FROM Gadgets;`

**Q: Connection pool not working?**  
A: Verify configuration: `node inspect_schema.js`

**Q: Need to reset MySQL?**  
A: `mysqldump -u root -p gadget_rental > backup.sql && mysql -u root -p < backup.sql`

---

## 🚀 Next Steps

1. ✅ Update MySQL configuration
2. ✅ Restart MySQL
3. ✅ Run benchmark tests
4. ✅ Document baseline metrics
5. ✅ Optimize based on results
6. ✅ Deploy to production

---

**Configuration Status:** ✅ Ready for Benchmarking
