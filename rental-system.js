// Rental Management System
const RentalSystem = {
    // Random owner names pool
    ownerNames: [
        'Raj Patel', 'Priya Kumar', 'Arjun Singh', 'Neha Gupta', 'Vikram Shah',
        'Aisha Khan', 'Rohan Verma', 'Pooja Sharma', 'Amit Reddy', 'Disha Nair',
        'Akshay Desai', 'Isha Kapoor', 'Dev Sharma', 'Ananya Joshi', 'Sanjay Iyer',
        'Riya Patel', 'Nikhil Bhat', 'Zara Khan', 'Aryan Desai', 'Swati Singh'
    ],

    phoneNumbers: () => {
        return `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`.slice(0, 13);
    },

    // Get random owner details
    getRandomOwner() {
        const name = this.ownerNames[Math.floor(Math.random() * this.ownerNames.length)];
        const phone = this.phoneNumbers();
        return { name, phone };
    },

    // Track rental - stores gadget rental info
    rentGadget(gadgetId, userId, rentalDays, returnDate) {
        const rentals = JSON.parse(localStorage.getItem('gadget_rentals') || '{}');
        if (!rentals[gadgetId]) {
            rentals[gadgetId] = [];
        }
        rentals[gadgetId].push({
            gadgetId,
            rentedBy: userId,
            startDate: new Date().toISOString(),
            returnDate: returnDate,
            rentalDays: rentalDays,
            status: 'active'
        });
        localStorage.setItem('gadget_rentals', JSON.stringify(rentals));
    },

    // Check if gadget is currently rented
    isGadgetRented(gadgetId) {
        const rentals = JSON.parse(localStorage.getItem('gadget_rentals') || '{}');
        if (!rentals[gadgetId]) return false;
        
        const activeRentals = rentals[gadgetId].filter(r => {
            const returnDate = new Date(r.returnDate);
            return returnDate > new Date() && r.status === 'active';
        });
        
        return activeRentals.length > 0;
    },

    // Get rental info for gadget
    getRentalInfo(gadgetId) {
        const rentals = JSON.parse(localStorage.getItem('gadget_rentals') || '{}');
        if (!rentals[gadgetId]) return null;
        
        const activeRentals = rentals[gadgetId].filter(r => {
            const returnDate = new Date(r.returnDate);
            return returnDate > new Date() && r.status === 'active';
        });
        
        if (activeRentals.length === 0) return null;
        
        const latestRental = activeRentals[activeRentals.length - 1];
        return {
            isRented: true,
            returnDate: new Date(latestRental.returnDate),
            rentedBy: latestRental.rentedBy
        };
    },

    // Calculate total cost
    calculateTotalCost(dailyRate, deposit, days) {
        return (dailyRate * days) + deposit;
    },

    // Format date for display
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    },

    // Calculate days remaining
    getDaysRemaining(returnDate) {
        const today = new Date();
        const return_date = new Date(returnDate);
        const diffTime = return_date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
};
