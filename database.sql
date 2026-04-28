-- Create the database
CREATE DATABASE gadget_rental;
USE gadget_rental;

-- Users table
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100),
    password_hash VARCHAR(255),
    contact_info VARCHAR(100)
);

-- Gadgets table
CREATE TABLE Gadgets (
    gadget_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    daily_rate DECIMAL(10,2),
    status ENUM('Available', 'Rented') DEFAULT 'Available',
    image_url VARCHAR(255),
    description TEXT,
    owner_name VARCHAR(100),
    owner_contact VARCHAR(100),
    delivery_location VARCHAR(100)
);

-- Orders table
CREATE TABLE Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    gadget_id INT,
    rental_days INT,
    total_amount DECIMAL(10,2),
    status ENUM('Pending','Confirmed','Returned') DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (gadget_id) REFERENCES Gadgets(gadget_id)
);

-- Payments table
CREATE TABLE Payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    amount DECIMAL(10,2),
    status ENUM('Pending','Paid') DEFAULT 'Pending',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gadget_id INT,
    sender_email VARCHAR(100),
    owner_email VARCHAR(100),
    message_text TEXT,
    is_from_owner BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gadget_id) REFERENCES Gadgets(gadget_id)
);

-- Reviews table
CREATE TABLE Reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    gadget_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (gadget_id) REFERENCES Gadgets(gadget_id)
);

-- Sample data
INSERT INTO Gadgets (name, category, daily_rate, description, owner_name, owner_contact, delivery_location)
VALUES 
('Canon EOS DSLR', 'Cameras', 250.00, 'Professional DSLR camera', 'Rahul', '9876543210', 'Campus Hostel'),
('Arduino Uno Kit', 'Electronics', 50.00, 'Starter kit for electronics projects', 'Amit', '9123456780', 'Library');
