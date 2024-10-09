const AdminModel = require("../models/AdminSchema");
const UserModel = require("../models/UserSchema");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateTokens");
const NotesModel = require("../models/AllNotes");


module.exports.loginAdmin = async (req, res) => {
    try {
        let { rollno, password } = req.body;

        // Use await to get the admin and users from the database
        let admin = await AdminModel.findOne({ rollno: rollno }); // Added await
        let users = await UserModel.find({ status: "verified" }); // Fetch the users only if the admin is authenticated
        let notesAddedMap = {};
        let notesLovedMap = {};

        for (let user of users) {
            // Fetch notes added by the user
            if (user.notesadded.length > 0) {
                let notesAdded = await NotesModel.find({ notesId: { $in: user.notesadded } });
                notesAddedMap[user._id] = notesAdded;
            }

            // Fetch notes loved by the user
            if (user.notesloved.length > 0) {
                let notesLoved = await NotesModel.find({ notesId: { $in: user.notesloved } });
                notesLovedMap[user._id] = notesLoved;
            }
        }

        

        if (!admin) {
            req.flash('prompt', 'No Not That !!!');
            return res.redirect("/");
        }

        // Compare the entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, admin.password); // Use await instead of callback
        if (isMatch) {
            let token = generateToken(admin);

            // Secure cookie settings for production
            res.cookie("token", token, {
                httpOnly: true,
                sameSite: "Strict"
            });

            // Render all users if login is successful
            res.render("AllUsers", { users, notesAddedMap, notesLovedMap });
        } else {
            req.flash('prompt', 'No Not That !!!');
            return res.redirect("/");
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("An error occurred during login");
    }
};

module.exports.logout = (req, res) => {
    // Properly clear the cookie by setting expiration
    res.cookie("token", "", {
        httpOnly: true,
        sameSite: "Strict",
        expires: new Date(0), // Expire immediately
    });
    res.redirect("/");
};

module.exports.registerUser = async (req, res) => {
    try {
        let { name, rollno, password } = req.body;

        // Check if the user already exists
        let user = await UserModel.findOne({ rollno: rollno });
        if (user) {
            req.flash('prompt', 'Ohh It does exist')
            return res.redirect('/admin/add');
        }

        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the new user
        let newUser = await UserModel.create({
            name: name,
            rollno: rollno,
            password: hashedPassword,
            status: 'verified'
        });

        // Redirect to the add user page after successful registration
        res.redirect("/admin/add");

    } catch (err) {
        console.error("Error during registration:", err.message);
        res.status(500).send(`An error occurred: ${err.message}`);
    }
};


module.exports.removeUser = async (req, res) => {
    try {
        let user = await UserModel.findOne({ rollno: req.body.rollno }); // Fixed case sensitivity and await
        if (!user) {
            return res.status(404).send("User not found");
        }

        await UserModel.deleteOne({ rollno: req.body.rollno }); // Fixed case sensitivity
        res.redirect("/admin/remove");
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error occurred during user removal");
    }
};

module.exports.changePasswordAdmin = async (req, res) => {
    try {
        // Get the logged-in admin from the middleware
        let admin = req.admin;  // `req.user` contains the logged-in admin info set by `isLoggedIn`

        let { oldPassword, newPassword } = req.body;

        // Compare the old password with the stored hashed password
        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            req.flash('prompt', 'Incorrect old password');
            return res.redirect("/admin/change-password");
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update admin's password in the database
        admin.password = hashedPassword;
        await admin.save();

        req.flash('prompt', 'Password updated successfully');
        res.redirect("/");
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server Error");
    }
};

