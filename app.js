const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { uploadFile , generateLink } = require("./controllers/DriveFlow");
const UnderVerificationModel = require("./models/UnderVerification");
const AllNotesModel = require("./models/AllNotes");
const AdminRoute = require("./routes/AdminRoute");
const UserRoute = require("./routes/UserRoute");
const cookieParser = require('cookie-parser');
const db = require("./config/mongoose-connection");
const expressSession = require('express-session');
const home = require("./routes/index");
const flash = require('connect-flash');
const {loginUser,logout,changePassword,registerUser,verifyEmail} = require("./controllers/UserAuth");
const cron = require('node-cron');
const UserModel = require('./models/UserSchema');

const app = express();
const PORT = 3000;


// Set the view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: "KNJFBBJNK"
    })
);

app.use(flash());
// Configure Multer for file uploads with multiple MIME types
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // Save files to 'uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));  // Append the current timestamp to avoid name conflicts
    }
});

// Define acceptable file types and MIME types
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /pdf|png|jpeg|jpg/;  // Allowed extensions
    const mimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];  // Allowed MIME types

    // Validate file extension and MIME type
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = mimeTypes.includes(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);  // Accept the file
    } else {
        cb(new Error("Only PDF, PNG, JPG, and JPEG files are allowed"), false);  // Reject the file
    }
};

// Configure Multer with fileFilter and size limits
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }  // Set file size limit to 50 MB
});

// Handle the form submission and upload the file to Google Drive
app.post("/user/create", upload.single('image'), async (req, res) => {
    try {
        // Ensure MongoDB connection is established
        if (mongoose.connection.readyState !== 1) {
            throw new Error("Database connection not established.");
        }

        // Path to the uploaded file
        const filePath = req.file.path;
        const name = req.body.name;

        // Call the uploadFile function to upload to Google Drive
        const info = await uploadFile(filePath, name);

        // Remove the file after uploading to Google Drive
        fs.unlinkSync(filePath);

        // Destructure other fields from the form submission
        let { sem, branch, subject, proffesorName, userId} = req.body;

        // Generate the Google Drive view and download links
        const web = await generateLink(info.id);

        // Save the new note to the UnderVerificationModel
        let UnderVerification = await UnderVerificationModel.create({
            name: name,
            sem: sem,
            branch: branch,
            subject: subject,
            proffesorName: proffesorName,
            notesLink: web.webViewLink,
            notesDownLink: web.webContentLink,
            notesId: info.id,
            userId: userId
        });

        req.flash('prompt','No one,No one teach it better.')
        res.redirect("/user/createnote");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error uploading file");
    }
});

app.use("/admin", AdminRoute);

app.use("/user",UserRoute);

app.use("/verify-email", verifyEmail);

app.use("/register", registerUser);

app.use("/", home);

cron.schedule('* * * * *', async () => {
    try {
        await UserModel.deleteMany({
            status: 'pending',
            verificationExpiry: { $lt: Date.now() }
        });
        console.log("Cleaned up unverified users.");
    } catch (err) {
        console.log(err.message);
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
