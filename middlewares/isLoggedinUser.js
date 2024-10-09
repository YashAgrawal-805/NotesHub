const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserSchema");
require('dotenv').config();

module.exports.isLoggedIn = async (req, res, next) => {
    // Check if token exists in cookies
    if (!req.cookies.token) {
        return res.redirect("/login"); // Redirect to login if no token
    }

    try {
        // Verify the token and decode it
        let decoded = jwt.verify(req.cookies.token, process.env.JWT); // Ensure your secret key matches

        console.log("Decoded JWT:", decoded); // Log the decoded JWT for debugging

        // Find the user by the rollno in the decoded token
        let user = await UserModel.findOne({ rollno: decoded.rollno });

        // If no user found, redirect to login
        if (!user) {
            return res.redirect("/login");
        }
        // Attach the user to the request object
        req.user = user;

        // Proceed to the next middleware or route
        next();
    } catch (err) {
        console.log("Error in isLoggedIn middleware:", err.message); // Log any error
        return res.redirect("/login");
    }
};
