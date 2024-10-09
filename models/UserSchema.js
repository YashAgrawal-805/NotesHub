const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rollno: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "pending"  // The default status is "pending" until verified
    },
    verificationToken: {
        type: String,
    },
    verificationExpiry: {  // Add expiration timestamp for the verification token
        type: Date,
    },
    notesadded: [{
        type: String,
        default: []
    }],
    notesloved: [{
        type: String,
        default: []
    }],
    likes:[{
        type: String,
        default:[]
    }],
    dislikes:[{
        types:String,
        default:[]
    }],
    
}, { timestamps: true });  // This will automatically add createdAt and updatedAt fields

module.exports = mongoose.model("User", UserSchema);
