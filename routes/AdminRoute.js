const express = require("express");
const router = express.Router();
const UnderVerificationModel = require("../models/UnderVerification");
const AllNotesModel = require("../models/AllNotes");
const {deleteFile} = require("../controllers/DriveFlow");
const {loginAdmin , logout , registerUser , removeUser , changePasswordAdmin} = require("../controllers/AdminAuth");
const isLoggedIn = require("../middlewares/isLoggedinAdmin");
const UserModel = require("../models/UserSchema");

router.post("/",loginAdmin);

router.get("/change-password", isLoggedIn, (req, res) => {
    const prompt = req.flash('prompt');
    res.render('changePasswordAdmin', { prompt });
});

// Handle change password request (POST)
router.post("/change-password", isLoggedIn, changePasswordAdmin);

router.get("/allusers", isLoggedIn, async (req, res) => {
    try {
        let users = await UserModel.find({ status: "verified" });

        // Fetch all notes added by the users
        let notesAddedMap = {};
        let notesLovedMap = {};

        for (let user of users) {
            // Fetch notes added by the user
            if (user.notesadded.length > 0) {
                let notesAdded = await AllNotesModel.find({ notesId: { $in: user.notesadded } });
                notesAddedMap[user._id] = notesAdded;
            }

            // Fetch notes loved by the user
            if (user.notesloved.length > 0) {
                let notesLoved = await AllNotesModel.find({ notesId: { $in: user.notesloved } });
                notesLovedMap[user._id] = notesLoved;
            }
        }

        res.render("AllUsers", { users, notesAddedMap, notesLovedMap });
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error retrieving users or notes");
    }
});


router.post("/add",isLoggedIn, async (req, res) => {
    const prompt  = req.flash('prompt');
    res.render("adduser", {prompt});
});

router.get("/add",isLoggedIn, (req, res) => {
    const prompt  = req.flash('prompt');
    res.render("adduser", {prompt});
});

router.post("/adduser",isLoggedIn, isLoggedIn, registerUser);

router.post("/remove" ,isLoggedIn, async(req,res) => {
    try {
        let users = await UserModel.find({ status: "verified" });
        res.render("removeusers", { users });
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error retrieving users");
    }
})

router.get("/remove" ,isLoggedIn, async(req,res) => {
    try {
        let users = await UserModel.find({ status: "verified" });
        res.render("removeusers", { users });
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error retrieving users");
    }
})

router.post("/removeuser",isLoggedIn, removeUser);

router.get("/Notes",isLoggedIn, async (req, res) => {
    const notes = await UnderVerificationModel.find();
    res.render("UnderVerificationNotes", { UnderVerificationModel: notes });
});

router.post("/pass",isLoggedIn, async (req, res) => {
    const id = req.body.noteId;  // Fix the key to match the form input name 'noteId'
    
    try {
        // Find the note in UnderVerificationModel
        let note = await UnderVerificationModel.findOne({ notesId: id });

        if (!note) {
            return res.status(404).send("Note not found");
        }

        // Create a new note in AllNotesModel
        await AllNotesModel.create({
            name: note.name,
            sem: note.sem,
            branch: note.branch,
            subject: note.subject,
            proffesorName: note.proffesorName,
            notesOpenLink: note.notesLink,
            notesDownLink: note.notesDownLink,  // Add notesDownLink if available
            notesId: note.notesId,
            userId: note.userId
        });
        await UnderVerificationModel.findOneAndDelete({ notesId: id });

        const user = await UserModel.findOne({ rollno: note.userId });
        if (!user) {
            return res.status(404).send("User not found");
        }
        user.notesadded.push(note.notesId);
        await user.save();

        res.redirect("/Admin/Notes");

    } catch (err) {
        console.error("Error passing note:", err);
        res.status(500).send("An error occurred while processing the note.");
    }
});

router.post("/deny",isLoggedIn, async(req,res) => {
    const id = req.body.noteId;
    try{
        let note = await UnderVerificationModel.findOne({ notesId: id });

        if (!note) {
            return res.status(404).send("Note not found");
        }
        await UnderVerificationModel.findOneAndDelete({ notesId: id });

        await deleteFile(id);
        res.redirect("/Admin/Notes");
    }
    catch(err){
        console.error("Error deleting note:", err);
        res.status(500).send("An error occurred while deleting the note.");
    }
})

router.get("/logout",isLoggedIn, logout);

module.exports = router;

