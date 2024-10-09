const mongoose = require("mongoose");
const mongoURI ="mongodb://127.0.0.1:27017/NotesHub";
// const mongoURI ="mongodb+srv://noteshub008:aHjMXhyml4J9wFZS@cluster0.uoehi.mongodb.net/NotesHub?retryWrites=true&w=majority&appName=Cluster0";
mongoose.set('debug', true); // Enable detailed Mongoose logs

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 60000  // 30 seconds timeout for server selection
})
.then(function() {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.error("Failed to connect to MongoDB", err);
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});
