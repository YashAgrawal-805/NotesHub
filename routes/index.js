const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
    const prompt = req.flash('prompt')
    res.render("login", { prompt }); // Renders the "index.ejs" file
});

module.exports = router;