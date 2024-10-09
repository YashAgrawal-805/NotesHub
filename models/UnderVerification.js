const mongoose = require("mongoose");

const VerificationNotesSchema = mongoose.Schema({
    name: String,
    sem: String,
    branch: String,
    subject: String,
    proffesorName: String,
    notesLink: String,
    notesDownLink: String,
    notesId: String,
    userId: String
});

module.exports = mongoose.model("VerificationNotes", VerificationNotesSchema);