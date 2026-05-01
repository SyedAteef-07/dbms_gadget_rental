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

// Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "SyedAteef@0786",
    database: "gadget_rental"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("Connected to MySQL Database.");

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

    db.query(createGadgetsTable, (createErr) => {
        if (createErr) {
            console.error('Could not ensure Gadgets table exists:', createErr);
            return;
        }
        console.log('Gadgets table is ready.');
    });

    db.query("ALTER TABLE Gadgets ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0", (alterErr) => {
        if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
            console.error('Could not ensure deposit_amount column exists:', alterErr);
        }
    });

    db.query("ALTER TABLE Gadgets ADD COLUMN owner_email VARCHAR(100)", (alterErr) => {
        if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
            console.error('Could not ensure owner_email column exists:', alterErr);
        }
    });

    db.query("ALTER TABLE Gadgets ADD COLUMN owner_phone VARCHAR(100)", (alterErr) => {
        if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
            console.error('Could not ensure owner_phone column exists:', alterErr);
        }
    });

    db.query("ALTER TABLE Gadgets MODIFY COLUMN image_url LONGTEXT", (alterErr) => {
        if (alterErr) {
            console.error('Could not modify image_url to LONGTEXT:', alterErr);
        }
    });

    db.query("ALTER TABLE Gadgets MODIFY COLUMN description LONGTEXT", (alterErr) => {
        if (alterErr) {
            console.error('Could not modify description to LONGTEXT:', alterErr);
        }
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
        const isOwner = ownerContact
            ? [dbOwnerContact, dbOwnerEmail, dbOwnerPhone].includes(ownerContact)
            : ownerName
                ? dbOwnerName === ownerName
                : false;

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