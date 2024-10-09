const jwt = require("jsonwebtoken");
require('dotenv').config();

const generateToken = (user)=>{
    return jwt.sign({rollno : user.rollno, id: user._id},process.env.JWT);
}
module.exports.generateToken = generateToken;