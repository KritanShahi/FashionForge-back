const express = require("express");
const dotenv = require('dotenv');
const cors = require("cors");
const bodyParser = require('body-parser');
const authRoute = require("./routes/auth");
const homeRoutes = require('./app'); // Assuming this is where you define home routes
require('./connection');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Use the home routes under the /home path
app.use("/home", homeRoutes);
app.use("/api", authRoute);

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});
