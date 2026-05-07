const mysql = require('mysql2');

// Connection Pool (Consistent with server.js)
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'SyedAteef@0786',
  database: 'gadget_rental',
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL with Connection Pool');

  connection.query('SHOW CREATE TABLE Gadgets', (err, rows) => {
    if (err) {
      console.error('❌ Query Error:', err.message);
      connection.release();
      process.exit(1);
    }
    console.log('\n📋 Gadgets Table Schema:\n');
    console.log(rows[0]['Create Table']);
    connection.release();
    pool.end(() => {
      console.log('\n✅ Connection closed.');
      process.exit(0);
    });
  });
});
