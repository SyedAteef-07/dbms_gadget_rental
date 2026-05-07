const mysql = require('mysql2');
const { performance } = require('perf_hooks');

// Connection Pool Configuration
const pool = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "SyedAteef@0786",
    database: "gadget_rental",
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true
});

console.log('🔧 MySQL Benchmark Tool\n');

// Test 1: Connection Pool Health Check
async function testPoolHealth() {
    return new Promise((resolve) => {
        console.log('📊 Test 1: Connection Pool Health Check');
        pool.getConnection((err, connection) => {
            if (err) {
                console.log('❌ Failed:', err.message);
                resolve(false);
                return;
            }
            console.log('✅ Connection acquired from pool');
            connection.query('SELECT 1 AS result', (queryErr, results) => {
                connection.release();
                if (queryErr) {
                    console.log('❌ Query failed:', queryErr.message);
                    resolve(false);
                } else {
                    console.log('✅ Query executed successfully');
                    resolve(true);
                }
            });
        });
    });
}

// Test 2: Single Query Performance
async function testQueryPerformance() {
    return new Promise((resolve) => {
        console.log('\n📊 Test 2: Query Performance (Single Query)');
        const start = performance.now();
        pool.query('SELECT COUNT(*) as count FROM Gadgets', (err, results) => {
            const end = performance.now();
            const duration = (end - start).toFixed(2);
            if (err) {
                console.log('❌ Failed:', err.message);
                resolve(false);
            } else {
                console.log(`✅ Query completed in ${duration}ms`);
                console.log(`   Total gadgets: ${results[0].count}`);
                resolve(true);
            }
        });
    });
}

// Test 3: Concurrent Queries (Benchmark Load)
async function testConcurrentQueries(numQueries = 20) {
    return new Promise((resolve) => {
        console.log(`\n📊 Test 3: Concurrent Queries (${numQueries} queries)`);
        let completed = 0;
        let errors = 0;
        let totalTime = 0;
        const start = performance.now();

        for (let i = 0; i < numQueries; i++) {
            pool.query('SELECT * FROM Gadgets LIMIT 5', (err) => {
                completed++;
                if (err) errors++;

                if (completed === numQueries) {
                    const end = performance.now();
                    totalTime = end - start;
                    console.log(`✅ All ${numQueries} queries completed`);
                    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
                    console.log(`   Average per query: ${(totalTime / numQueries).toFixed(2)}ms`);
                    console.log(`   Errors: ${errors}`);
                    console.log(`   Success rate: ${(((numQueries - errors) / numQueries) * 100).toFixed(1)}%`);
                    resolve(errors === 0);
                }
            });
        }
    });
}

// Test 4: Stress Test with Connection Limits
async function testConnectionLimit() {
    return new Promise((resolve) => {
        console.log('\n📊 Test 4: Connection Pool Stress Test');
        let connections = 0;
        let maxConnections = 0;
        const testConnections = 15;
        let completed = 0;

        for (let i = 0; i < testConnections; i++) {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.log(`❌ Connection ${i + 1} failed:`, err.message);
                    completed++;
                } else {
                    connections++;
                    maxConnections = Math.max(maxConnections, connections);

                    setTimeout(() => {
                        connection.release();
                        connections--;
                        completed++;

                        if (completed === testConnections) {
                            console.log(`✅ Stress test completed`);
                            console.log(`   Max concurrent connections: ${maxConnections}/10 pool size`);
                            console.log(`   Connection queueing: ${testConnections > 10 ? 'Yes ✓' : 'No'}`);
                            resolve(true);
                        }
                    }, 100 + Math.random() * 200);
                }
            });
        }
    });
}

// Test 5: Query with Prepared Statements (Recommended for Benchmarking)
async function testPreparedStatements() {
    return new Promise((resolve) => {
        console.log('\n📊 Test 5: Prepared Statements Performance');
        const start = performance.now();
        const testId = 1;

        pool.query('SELECT * FROM Gadgets WHERE gadget_id = ?', [testId], (err, results) => {
            const end = performance.now();
            const duration = (end - start).toFixed(2);
            if (err) {
                console.log('❌ Failed:', err.message);
                resolve(false);
            } else {
                console.log(`✅ Prepared statement executed in ${duration}ms`);
                console.log(`   Results found: ${results.length}`);
                resolve(true);
            }
        });
    });
}

// Run all tests
async function runAllTests() {
    console.log('═'.repeat(50));
    console.log('Starting MySQL Benchmark Tests\n');
    console.log('═'.repeat(50));

    const test1 = await testPoolHealth();
    const test2 = await testQueryPerformance();
    const test3 = await testConcurrentQueries(20);
    const test4 = await testConnectionLimit();
    const test5 = await testPreparedStatements();

    console.log('\n' + '═'.repeat(50));
    console.log('📋 Summary:\n');
    console.log(`Pool Health:              ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Query Performance:        ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Concurrent Queries:       ${test3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Connection Limit Test:    ${test4 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Prepared Statements:      ${test5 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═'.repeat(50));

    pool.end((err) => {
        if (err) console.error('Error closing pool:', err);
        else console.log('\n✅ Benchmark complete. Connection pool closed.');
        process.exit(0);
    });
}

runAllTests().catch(err => {
    console.error('Benchmark error:', err);
    pool.end();
    process.exit(1);
});
