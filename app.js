const express = require("express");
const router = express.Router();

// Define the route for /home/a
router.get('/a', async (req, res) => {
    res.send("Hello World");
});



// Example route
router.get('/login',async (req, res) => {
    // Handle login
    res.send('Login route');
});

// Example route
router.get('/register',async (req, res) => {
    // Handle register
    res.send('Register route');
});




// Export the router
module.exports = router;
