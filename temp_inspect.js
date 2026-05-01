const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'SyedAteef@0786',
  database: 'gadget_rental'
});
db.connect(err => {
  if (err) {
    console.error('CONNECT ERROR', err);
    process.exit(1);
  }
  db.query('DESCRIBE Gadgets', (err, rows) => {
    if (err) {
      console.error('DESCRIBE ERROR', err);
      process.exit(1);
    }
    console.log(JSON.stringify(rows, null, 2));
    db.end();
  });
});
