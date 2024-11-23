const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Environment variables
const PASS_SEC = parseInt(process.env.PASS_SEC) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'yourSecretKey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// REGISTER
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body;

    // Check if the username or email is already in use
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, PASS_SEC);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin
    });

    const savedUser = await newUser.save();
    const { password: _, ...userWithoutPassword } = savedUser._doc; // Exclude password from response

    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if password matches
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Send response with token and user data
    const { password: _, ...userWithoutPassword } = user._doc;
    res.status(200).json({ ...userWithoutPassword, token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// LOGOUT (token-based logout example)
router.post('/logout', (req, res) => {
  res.clearCookie('token'); // Clears any token held in cookies, if applicable
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;

// const router = require('express').Router();
// const User = require('../models/User');
// const bcrypt = require('bcrypt');

// // REGISTER
// router.post('/signup', async (req, res) => {
//   try {
//     const { username, email, password,isAdmin } = req.body;

//     // Check if the username or email is already in use
//     const existingUser = await User.findOne({ $or: [{ username }, { email }] });
//     if (existingUser) {
//       res.status(409).json('Username or email already in use');
//       return;
//     }

//     // Hash the password using bcrypt
//     const PASS_SEC= parseInt(process.env.PASS_SEC) ;
//     const hashedPassword = await bcrypt.hash(password, PASS_SEC);

//     const newUser = new User({
//       username,
//       email,
//       password: hashedPassword,
//       isAdmin

//     });

//     const savedUser = await newUser.save();
//     res.status(201).json(savedUser);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });




// router.post('/login', async (req, res) => {
//   try {
//     const { username, password } = req.body;
    
//     // Find the user by username
//     const user = await User.findOne({ username });
    
//     if (!user) {
//       return res.status(401).json("Wrong Credentials user!");
//     }
    
//     // Compare the entered password with the stored hashed password
//     const passwordMatch = await bcrypt.compare(password, user.password);
    
//     console.log("Entered password: " + password);          // Logging entered password
//     console.log("Hashed password from DB: " + user.password); // Logging hashed password
    
//     if (!passwordMatch) {
//       return res.status(401).json('Incorrect password');
//     }
    
//     // Destructure user to exclude the password field from response
//     const { password: userPassword, ...others } = user._doc;
    
//     // Generate accessToken (assuming you have JWT or similar)
//     const accessToken = "yourAccessToken"; // You should implement a proper access token logic
    
//     res.status(200).json({ ...others, accessToken });
//   } catch (err) {
//     console.error("Error during login: ", err);  // Log the error for debugging
//     res.status(500).json("Server error");
//   }

//   });



// // Logout Route (example for token-based auth)
// router.post('/logout', (req, res) => {
//   // If using sessions:
//   // req.session.destroy();

//   // If using tokens:
//   res.clearCookie('token'); // Clear the cookie holding the token, if applicable
  
//   res.status(200).json({ message: 'Logged out successfully' });
// });




// module.exports = router;






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
