const jwt = require("jsonwebtoken");
const adminModel = require("../models/AdminSchema");
require('dotenv').config();

module.exports = async (req, res, next) => {
    if (!req.cookies.token) {
        console.log("No token found, redirecting to login");
        return res.redirect("/");
    }

    try {
        // Verify JWT token
        let decoded = jwt.verify(req.cookies.token, process.env.JWT);

        // Find admin by rollno and exclude the password field
        let admin = await adminModel.findOne({ rollno: decoded.rollno });

        // If admin is not found, redirect to login page
        if (!admin) {
            console.log("admin not found, redirecting to login");
            return res.redirect("/");
        }

        // Attach admin to request object
        req.admin = admin;
        next();
    } catch (err) {
        console.error("Error verifying token: ", err);
        return res.redirect("/");
    }
};
