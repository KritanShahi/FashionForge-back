const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// REGISTER
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password,isAdmin } = req.body;

    // Check if the username or email is already in use
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      res.status(409).json('Username or email already in use');
      return;
    }

    // Hash the password using bcrypt
    const PASS_SEC= parseInt(process.env.PASS_SEC) ;
    const hashedPassword = await bcrypt.hash(password, PASS_SEC);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin

    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});




router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find the user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json("Wrong Credentials user!");
    }
    
    // Compare the entered password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    console.log("Entered password: " + password);          // Logging entered password
    console.log("Hashed password from DB: " + user.password); // Logging hashed password
    
    if (!passwordMatch) {
      return res.status(401).json('Incorrect password');
    }
    
    // Destructure user to exclude the password field from response
    const { password: userPassword, ...others } = user._doc;
    
    // Generate accessToken (assuming you have JWT or similar)
    const accessToken = "yourAccessToken"; // You should implement a proper access token logic
    
    res.status(200).json({ ...others, accessToken });
  } catch (err) {
    console.error("Error during login: ", err);  // Log the error for debugging
    res.status(500).json("Server error");
  }

  });







module.exports = router;






  /*
  // LOGIN
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Find the user by username
      const user = await User.findOne({ username });
  
      if (!user) {
        res.status(401).json("Wrong Credentials user!");
        return;
      }
  
      // Compare the entered password with the stored hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      console.log(password+" "+user.password);//1234356714 $2b$10$oHGuunPcx.o01BDfL4QREeHvuiHoJNFMa503NLXAcjUV6UArb8gly
      if (!passwordMatch) {
        res.status(401).json('Incorrect password');
        return;
      }
      const accessToken = "yourAccessToken";
      const { password: userPassword, ...others } = user._doc;
      res.status(200).json( ...others);
    } catch (err) {
      res.status(500).json(err);
    }
  })*/
