const mongoose = require("mongoose");

const NotesSchema = mongoose.Schema({
    name: String,
    sem: String,
    branch: String,
    subject: String,
    proffesorName: String,
    notesOpenLink: String,
    notesDownLink: String,
    notesId: String,
    userId: String,
    hearts: {
        type: Number,
        default: 0
    },
    likes: {
        type: [String], // Array of rollno or user IDs (adjust as necessary)
        default: []
    },
    dislikes: {
        type: [String], // Array of rollno or user IDs (adjust as necessary)
        default: []
    },
    comments: {
        type: [{
            rollno: String,   // ID of the user who commented
            comment: String,  // The comment text
            date: { type: Date, default: Date.now }
        }],
        default: []
    }
},{ timestamps: true });

module.exports = mongoose.model("Notes", NotesSchema);
