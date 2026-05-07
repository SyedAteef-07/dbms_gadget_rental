const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Connection Pool - Optimized for Benchmarking
const db = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "SyedAteef@0786",
    database: "gadget_rental",
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true
});

db.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ER_AUTHENTICATION_PLUGIN_ERROR') {
            console.error('Database authentication failed.');
        }
        return;
    }
    if (connection) connection.release();
    console.log("✅ MySQL Connection Pool Established (10 connections available).");

    // Initialize database schema
    const createGadgetsTable = `CREATE TABLE IF NOT EXISTS Gadgets (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

    db.query(createGadgetsTable, (createErr) => {
        if (createErr) {
            console.error('❌ Could not ensure Gadgets table exists:', createErr.message);
            return;
        }
        console.log('✅ Gadgets table is ready.');

        db.query('SELECT COUNT(*) AS cnt FROM Gadgets', (countErr, countResult) => {
            if (countErr) {
                console.error('❌ Could not count gadgets:', countErr.message);
                return;
            }

            const gadgetCount = countResult[0].cnt || 0;
            if (gadgetCount === 0) {
                const insertSamples = `INSERT INTO Gadgets
                    (name, category, daily_rate, deposit_amount, image_url, description, owner_name, owner_email, owner_phone, owner_contact, delivery_location, status)
                    VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                const sampleValues = [
                    'Scientific Calculator', 'Calculators', 50.00, 200.00,
                    'https://images.unsplash.com/photo-1512446733611-9099a758e1d7?auto=format&fit=crop&w=800&q=80',
                    'Reliable scientific calculator for campus exams and projects.',
                    'Student', '', '', '', 'Campus', 'Available',
                    'Arduino Uno Kit', 'Electronics', 100.00, 250.00,
                    'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=800&q=80',
                    'Complete Arduino starter kit for electronics and robotics.',
                    'Student', '', '', '', 'Campus', 'Available',
                    'DSLR Camera', 'Photography', 300.00, 500.00,
                    'https://images.unsplash.com/photo-1519183071298-a2962be54a10?auto=format&fit=crop&w=800&q=80',
                    'Mirrorless DSLR camera perfect for high-quality photo shoots.',
                    'Student', '', '', '', 'Campus', 'Available',
                    'Laptop', 'Electronic', 200.00, 300.00,
                    'https://images.unsplash.com/photo-1517059224940-d4af9eec41e5?auto=format&fit=crop&w=800&q=80',
                    'Fully functional laptop ideal for study and creative work.',
                    'Student', '', '9916157360', '9916157360', 'IHC', 'Available'
                ];

                db.query(insertSamples, sampleValues, (insertErr, result) => {
                    if (insertErr) {
                        console.error('❌ Could not insert sample gadgets:', insertErr.message);
                        return;
                    }
                    console.log(`✅ Inserted ${result.affectedRows} sample gadget records.`);
                });
            }
        });
    });

    // Ensure schema columns exist
    db.query("ALTER TABLE Gadgets ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0", (err) => {
        if (err?.code !== 'ER_DUP_FIELDNAME') console.error(err?.message);
    });

    db.query("ALTER TABLE Gadgets ADD COLUMN owner_email VARCHAR(100)", (err) => {
        if (err?.code !== 'ER_DUP_FIELDNAME') console.error(err?.message);
    });

    db.query("ALTER TABLE Gadgets ADD COLUMN owner_phone VARCHAR(100)", (err) => {
        if (err?.code !== 'ER_DUP_FIELDNAME') console.error(err?.message);
    });

    db.query("ALTER TABLE Gadgets MODIFY COLUMN image_url LONGTEXT", (err) => {
        if (err) console.error(err.message);
    });

    db.query("ALTER TABLE Gadgets MODIFY COLUMN description LONGTEXT", (err) => {
        if (err) console.error(err.message);
    });

    db.query("ALTER TABLE Gadgets MODIFY COLUMN owner_contact VARCHAR(100) DEFAULT NULL", (err) => {
        if (err) console.error(err.message);
    });

    db.query("ALTER TABLE Gadgets ADD COLUMN status VARCHAR(50) DEFAULT 'Available'", (err) => {
        if (err?.code !== 'ER_DUP_FIELDNAME') console.error(err?.message);
    });
});

// --- API ROUTES ---

// 1. Fetch all gadgets
app.get('/api/gadgets', (req, res) => {
    const q = "SELECT * FROM Gadgets";
    db.query(q, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// 2. Add a new gadget listing
app.post('/api/add-gadget', (req, res) => {
    const { name, category, rate, image, desc, deposit_amount, owner_name, owner_email, owner_phone, delivery_location } = req.body;

    const q = `INSERT INTO Gadgets 
               (name, category, daily_rate, deposit_amount, image_url, description, 
                owner_name, owner_email, owner_phone, owner_contact, delivery_location) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [name, category, rate, deposit_amount || 0, image, desc, owner_name, owner_email || '', owner_phone || '', owner_phone || owner_email || '', delivery_location];

    db.query(q, values, (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Gadget listed successfully!", id: result.insertId });
    });
});

// 3. Chat routes
app.post('/api/send-message', (req, res) => {
    const { gadget_id, sender, owner, text, is_owner } = req.body;
    const q = "INSERT INTO chat_messages (gadget_id, sender_email, owner_email, message_text, is_from_owner) VALUES (?, ?, ?, ?, ?)";
    db.query(q, [gadget_id, sender, owner, text, is_owner], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(200).json({ success: true });
    });
});

app.get('/api/get-chat/:sender/:owner/:gadget', (req, res) => {
    const q = "SELECT * FROM chat_messages WHERE sender_email = ? AND owner_email = ? AND gadget_id = ? ORDER BY timestamp ASC";
    db.query(q, [req.params.sender, req.params.owner, req.params.gadget], (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

// 4. Create an order
app.post('/api/create-order', (req, res) => {
    const { email, gadget_id, rental_days, total_amount } = req.body;

    db.query("SELECT user_id FROM Users WHERE email = ?", [email], (err, user) => {
        if (err || user.length === 0) return res.status(404).json("User not found");

        const userId = user[0].user_id;
        const q = "INSERT INTO Orders (user_id, gadget_id, rental_days, total_amount) VALUES (?, ?, ?, ?)";
        
        db.query(q, [userId, gadget_id, rental_days, total_amount], (err, order) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Order created successfully!", orderId: order.insertId });
        });
    });
});

    // DELETE gadget route
app.delete('/api/gadgets/:id', (req, res) => {
    const gadgetId = req.params.id;
    const ownerContact = req.query.owner_contact?.trim().toLowerCase();
    const ownerName = req.query.owner_name?.trim().toLowerCase();
    const forceDelete = req.query.force === 'true';

    const findQuery = "SELECT owner_contact, owner_email, owner_phone, owner_name FROM Gadgets WHERE gadget_id = ?";
    db.query(findQuery, [gadgetId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (!results.length) return res.status(404).json({ error: "Gadget not found" });

        const dbOwnerContact = (results[0].owner_contact || '').trim().toLowerCase();
        const dbOwnerEmail = (results[0].owner_email || '').trim().toLowerCase();
        const dbOwnerPhone = (results[0].owner_phone || '').trim().toLowerCase();
        const dbOwnerName = (results[0].owner_name || '').trim().toLowerCase();
        const hasOwner = Boolean(dbOwnerContact || dbOwnerEmail || dbOwnerPhone || dbOwnerName);

        const isOwnerByContact = ownerContact ? [dbOwnerContact, dbOwnerEmail, dbOwnerPhone].includes(ownerContact) : false;
        const isOwnerByName = ownerName ? dbOwnerName === ownerName : false;
        const isOwner = isOwnerByContact || isOwnerByName;

        if (!isOwner && !(forceDelete && !hasOwner)) {
            return res.status(403).json({ error: "Unauthorized: only the owner can delete this gadget." });
        }

        db.query("DELETE FROM Gadgets WHERE gadget_id = ?", [gadgetId], (deleteErr) => {
            if (deleteErr) return res.status(500).json(deleteErr);
            res.json({ message: "Gadget deleted successfully" });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 