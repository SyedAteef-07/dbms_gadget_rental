require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.DB_PASSWORD,
    database: "gadget_rental"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("Connected to MySQL Database.");
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
    const { name, category, rate, image, desc, owner_name, owner_contact, delivery_location } = req.body;

    const q = `INSERT INTO Gadgets 
               (name, category, daily_rate, image_url, description, 
                owner_name, owner_contact, delivery_location) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [name, category, rate, image, desc, owner_name, owner_contact, delivery_location];

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

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 