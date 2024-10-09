const nodemailer = require("nodemailer");
require('dotenv').config();

const sendVerificationEmail = async (rollno, token) => {
    console.log(process.env.GOOGLEAPP);
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "noteshub008@gmail.com",
            pass: process.env.GOOGLEAPP,
        },
    });

    const mailOptions = {
        from: "noteshub008@gmail.com",
        to: `${rollno}@nitrkl.ac.in`,
        subject: "Email Verification",
        text: `Please verify your email by clicking the link: https://reimagine-pzln.onrender.com/verify-email?token=${token}&rollno=${rollno}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log('Error:', error); // Log the error
        }
        console.log('Email sent:', info.response); // Log the response
      });
    
};

module.exports = sendVerificationEmail;
