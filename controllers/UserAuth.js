const UserModel = require("../models/UserSchema");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateTokens");
const AllNotesModel = require("../models/AllNotes");
const sendVerificationEmail = require("../utils/sendVerificationEmail");


module.exports.loginUser = async (req, res) => {
    try {
        const { rollno, password } = req.body;

        // Find the user by rollno
        let user = await UserModel.findOne({ rollno });

        if (!user) {
            req.flash('prompt', 'No Not That !!!');
            return res.redirect("/");
        }

        // Check if user is verified
        if (user.status !== 'verified') {
            req.flash('prompt', 'Please verify your email first!');
            return res.redirect("/");
        }

        // Get added and loved notes
        let addedNotes = await AllNotesModel.find({ notesId: { $in: user.notesadded } });
        let lovedNotes = await AllNotesModel.find({ notesId: { $in: user.notesloved } });

        // Compare the provided password with the stored hashed password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.send(err.message);
            if (isMatch) {
                // Generate token for the user
                const token = generateToken(user);
                res.cookie("token", token, {
                    httpOnly: true,
                    sameSite: "Strict"
                });
                res.render("About", { user, addedNotes, lovedNotes });
            } else {
                req.flash('prompt', 'No Not That !!!');
                return res.redirect("/");
            }
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server Error");
    }
};

// Logout User
module.exports.logout = (req, res) => {
    res.cookie("token", "", { httpOnly: true, sameSite: "Strict" });
    res.redirect("/");
};

// Change Password
module.exports.changePassword = async (req, res) => {
    try {
        let user = req.user; // Populated by isLoggedIn middleware
        if (!user) {
            req.flash('prompt', 'User not found');
            return res.redirect("/change-password");
        }

        if (user.status !== 'verified') {
            req.flash('prompt', 'Please verify your email first!');
            return res.redirect("/change-password");
        }

        const { oldPassword, newPassword } = req.body;
        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            req.flash('prompt', 'Incorrect old password');
            return res.redirect("/user/changepassword");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        req.flash('prompt', 'Password updated successfully');
        res.redirect("/");
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server Error");
    }
};

// Register User (New Function for Registration and Verification)
module.exports.registerUser = async (req, res) => {
    try {
        const { name, rollno, password } = req.body;

        const userExists = await UserModel.findOne({ rollno });
        if (userExists) {
            req.flash('prompt', 'User already exists');
            return res.redirect("/register");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = generateToken({ rollno }, "30m");  // Token with 30-minute expiry
        const verificationExpiry = Date.now() + 30 * 60 * 1000;  // Set expiry time (30 mins)

        const newUser = new UserModel({
            name,
            rollno,
            password: hashedPassword,
            verificationToken,
            verificationExpiry,
            status: 'pending'  // Status is pending until verified
        });

        await newUser.save();

        // Send verification email
        await sendVerificationEmail(rollno, verificationToken);

        req.flash('prompt', 'Verification email sent on Zymbra!');
        res.redirect("/");
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server Error");
    }
};

// Verify Email
module.exports.verifyEmail = async (req, res) => {
    try {
        const { token, rollno } = req.query;
        const user = await UserModel.findOne({ rollno, verificationToken: token });
        if (!user) {
            req.flash('prompt', 'Invalid or expired verification link');
            return res.redirect("/");
        }

        if (user.verificationExpiry < Date.now()) {
            await UserModel.deleteOne({ rollno });
            req.flash('prompt', 'Verification link expired, please register again');
            return res.redirect("/");
        }

        user.status = 'verified';
        user.verificationToken = undefined;  // Clear token after verification
        user.verificationExpiry = undefined;
        await user.save();

        req.flash('prompt', 'Email verified successfully');
        res.redirect("/");
    } catch (err) {
        console.log(err.message);
        req.flash('prompt', 'Invalid or expired verification link');
        return res.redirect("/");
    }
};
