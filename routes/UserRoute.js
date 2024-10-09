const {loginUser, logout, changePassword} = require("../controllers/UserAuth");
const express = require("express");
const router = express.Router();
const AllNotesModel = require("../models/AllNotes");
const UserModel = require("../models/UserSchema");
const {isLoggedIn} = require("../middlewares/isLoggedinUser");
const {deleteFile} = require("../controllers/DriveFlow");

router.post("/", loginUser);

router.get("/changepassword", isLoggedIn, async(req,res) => {
    const prompt = req.flash('prompt');
    res.render('changepassword',{prompt});
})

router.post("/change-password", isLoggedIn, changePassword);

router.get("/about", isLoggedIn, async (req, res) => {
    try {
        let user = req.user;

        // Find the notes using the noteIds from notesadded
        let addedNotes = await AllNotesModel.find({
            notesId: { $in: user.notesadded }
        });

        let lovedNotes = await AllNotesModel.find({
            notesId: { $in: user.notesloved }
        });
        // Ensure that addedNotes is passed to the EJS template
        res.render("About", {addedNotes,user,lovedNotes});
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Error occurred while retrieving user details");
    }
});

router.get("/lovednotes", isLoggedIn, async (req, res) => {
    try {
        let user = req.user;

        // Ensure the user has notesloved field
        if (!user || !user.notesloved) {
            return res.status(400).send("User or loved notes not found");
        }

        // Fetch the notes loved by the user
        let notesloved = await AllNotesModel.find({
            notesId: { $in: user.notesloved }
        });

        res.render("lovednotes", { notesloved });
    } catch (err) {
        res.send(err.message);
    }
});

router.post("/removelovednote/:noteId",isLoggedIn, async(req, res) => {
    const noteId = req.params.noteId;
    try {
        let user = req.user;
        
        // Remove the noteId from the user's notesloved array
        user.notesloved = user.notesloved.filter(id => id !== noteId);

        // Save the updated user document
        await user.save();

        res.redirect("/user/lovednotes");  // Redirect back to the loved notes page
    }
    catch(err){
        res.send(err.message);
    }
});

router.get("/mynotes", isLoggedIn, async(req,res) => {
    try{
        let user = req.user;

        // Find the notes using the noteIds from notesadded
        let addedNotes = await AllNotesModel.find({
            notesId: { $in: user.notesadded }
        });

        res.render("mynotes", {addedNotes});
    }
    catch(err){
        res.send(err.message);
    }
});

router.post("/mynotes/delete", isLoggedIn, async(req,res) => {
    try {
        let noteId = req.body.noteId;

        // Delete the note from the user's notesadded array
        await UserModel.updateOne(
            { rollno: req.user.rollno },
            { $pull: { notesadded: noteId } }
        );

        deleteFile(noteId);
        // Optionally, remove the note from AllNotesModel if required
        await AllNotesModel.deleteOne({ notesId: noteId });

        // Redirect back to mynotes after deletion
        res.redirect("/user/mynotes");
    } catch (err) {
        res.status(500).send("Error deleting note: " + err.message);
    }
})

router.post('/addfavorite', isLoggedIn, async (req, res) => {
    try {
        let user = req.user;
        let noteId = req.body.noteId;

        // Check if the note is already in favorites
        if (user.notesloved.includes(noteId)) {
            req.flash('promt', 'You are already loving it! Do not go Naughty');
            return res.redirect('back');
        }

        // Add the note to the user's favorites (notesloved)
        await UserModel.updateOne(
            { rollno: user.rollno },
            { $push: { notesloved: noteId } }
        );

        // Redirect back to the page or send success response
        res.redirect('back'); // Redirect back to the same page

    } catch (err) {
        console.error('Error adding note to favorites:', err.message);
        res.status(500).send('Error occurred while adding note to favorites');
    }
});

router.get("/createnote",isLoggedIn, async(req,res) => {
    const prompt = req.flash('prompt');
    res.render("index",{prompt});
});

router.get("/notes",isLoggedIn, async (req, res) => {
    try {
        const notes = await AllNotesModel.find();
        const sems = [...new Set(notes.map(note => note.sem))]; // Remove duplicate sems
        res.render("sem", { sems });
    } catch (err) {
        console.error("Error fetching notes:", err);
        res.status(500).send("An error occurred while fetching the notes.");
    }
});

router.post("/notes/:sem",isLoggedIn, async (req, res) => {
    const sem = req.params.sem;

    try {
        const notes = await AllNotesModel.find({ sem });

        if (notes.length === 0) {
            return res.status(404).send(`No notes found for the sem ${sem}`);
        }

        const branches = [...new Set(notes.map(note => note.branch))]; // Remove duplicate branches
        res.render("Branch", { sem, branches });
    } catch (err) {
        console.error("Error fetching notes for the sem:", err);
        res.status(500).send("An error occurred while fetching notes for the selected sem.");
    }
});

router.post("/notes/:noteId/like", isLoggedIn, async (req, res) => {
    try {
        const noteId = req.params.noteId;
        const rollno = req.user.rollno;

        // Find the note
        let note = await AllNotesModel.findById(noteId);

        // Check if the user has already liked the note
        if (note.likes.includes(rollno)) {
            // If already liked, remove the like (toggle off)
            note.likes = note.likes.filter(id => id !== rollno);
        } else {
            // If not liked, add the like (toggle on)
            note.likes.push(rollno);
            // Remove from dislikes if present
            note.dislikes = note.dislikes.filter(id => id !== rollno);
        }

        await note.save();
        res.redirect('back');
    } catch (err) {
        console.error("Error liking the note:", err.message);
        res.status(500).send("Error liking the note.");
    }
});


// Dislike a note
router.post("/notes/:noteId/dislike", isLoggedIn, async (req, res) => {
    try {
        const noteId = req.params.noteId;
        const rollno = req.user.rollno;

        // Find the note
        let note = await AllNotesModel.findById(noteId);

        // Check if the user has already disliked the note
        if (note.dislikes.includes(rollno)) {
            // If already disliked, remove the dislike (toggle off)
            note.dislikes = note.dislikes.filter(id => id !== rollno);
        } else {
            // If not disliked, add the dislike (toggle on)
            note.dislikes.push(rollno);
            // Remove from likes if present
            note.likes = note.likes.filter(id => id !== rollno);
        }

        await note.save();
        res.redirect('back');
    } catch (err) {
        console.error("Error disliking the note:", err.message);
        res.status(500).send("Error disliking the note.");
    }
});


// Add a comment
router.post("/notes/:noteId/comment", isLoggedIn, async (req, res) => {
    try {
        const noteId = req.params.noteId;
        const rollno = req.user.rollno;
        const commentText = req.body.comment;

        let note = await AllNotesModel.findById(noteId);

        note.comments.push({ rollno: rollno, comment: commentText });

        await note.save();
        res.redirect('back');
    } catch (err) {
        console.error("Error adding a comment:", err.message);
        res.status(500).send("Error adding a comment.");
    }
});

router.post("/notes/:sem/:branch",isLoggedIn, async (req, res) => {
    const sem = req.params.sem;
    const branch = req.params.branch;

    try {
        const notes = await AllNotesModel.find({ sem: sem, branch: branch });

        if (notes.length === 0) {
            return res.status(404).send(`No notes found for the sem ${sem} and branch ${branch}`);
        }

        const subjects = [...new Set(notes.map(note => note.subject))];
        res.render("Subject", { sem, branch, subjects });
    } catch (err) {
        console.error("Error fetching notes for the sem and branch:", err);
        res.status(500).send("An error occurred while fetching notes for the selected sem and branch.");
    }
});

router.post("/notes/:sem/:branch/:subject",isLoggedIn, async (req, res) => {
    const { sem, branch, subject } = req.params;

    try {
        // Fetch the notes for the given sem, branch, and subject
        const notes = await AllNotesModel.find({ sem, branch, subject });

        if (notes.length === 0) {
            return res.status(404).send(`No notes found for the sem ${sem}, branch ${branch}, and subject ${subject}`);
        }

        // Extract unique professor names
        const proffesorNames = [...new Set(notes.map(note => note.proffesorName))];

        // Render the ProfName page with the extracted data
        res.render("ProfName", { sem, branch, subject, proffesorNames });
    } catch (err) {
        console.error("Error fetching notes for the sem, branch, and subject:", err);
        res.status(500).send("An error occurred while fetching notes.");
    }
});

router.post("/notes/:sem/:branch/:subject/:proffesorName",isLoggedIn, async (req, res) => {
    const { sem, branch, subject, proffesorName} = req.params;

    try {
        // Fetch the notes for the given sem, branch, and subject
        const notes = await AllNotesModel.find({ sem, branch, subject, proffesorName});

        if (notes.length === 0) {
            return res.status(404).send(`No notes found for the sem ${sem}, branch ${branch}, and subject ${subject}`);
        }
        const promt = req.flash('promt');

        // Render the ProfName page with the extracted data
        res.render("Notes", { sem, branch, subject, proffesorName, notes,promt});
    } catch (err) {
        console.error("Error fetching notes for the sem, branch, and subject:", err);
        res.status(500).send("An error occurred while fetching notes.");
    }
});

router.get("/notes/:sem/:branch/:subject/:proffesorName",isLoggedIn, async (req, res) => {
    const { sem, branch, subject, proffesorName} = req.params;

    try {
        // Fetch the notes for the given sem, branch, and subject
        const notes = await AllNotesModel.find({ sem, branch, subject, proffesorName});
        const promt = req.flash('promt');
        if (notes.length === 0) {
            return res.status(404).send(`No notes found for the sem ${sem}, branch ${branch}, and subject ${subject}`);
        }

        // Render the ProfName page with the extracted data
        res.render("Notes", { sem, branch, subject, proffesorName, notes,promt});
    } catch (err) {
        console.error("Error fetching notes for the sem, branch, and subject:", err);
        res.status(500).send("An error occurred while fetching notes.");
    }
});


router.get("/logout",isLoggedIn, logout);
module.exports = router;

