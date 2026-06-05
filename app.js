const express = require('express');
const path = require('path');

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const cookieparser = require("cookie-parser");
const {checkforauthenticationcookie} = require('./middleware/authmiddle');

const blog = require('./models/blogschema');

const userRoute = require('./routes/userroute');
const BlogRoute = require('./routes/blogroute');

const app = express();
const PORT = process.env.PORT || 8000;

// Parse form submissions and JSON bodies before routes read req.body.
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// Read the token cookie and attach the logged-in user to req.user.
app.use(cookieparser());
app.use(checkforauthenticationcookie("token"));
// Serve images and uploaded files from the public folder.
app.use(express.static(path.resolve('./public')));

// Connect the Express app to the local MongoDB BlogSite database.
mongoose
.connect(process.env.MONGODB_URL)
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.error("MongoDB Connection Failed");
    console.error(err);
});

// EJS templates from the views folder render the HTML pages.
app.set("view engine", "ejs");
app.set('views', path.resolve("./views"));

// Home page route shows all blogs from the database.
app.get('/', async (req,res) => {
    try {
        const allblogs = await blog.find({});
        res.render('home', {
            user: req.user,
            blogs: allblogs
        });
    } catch (err) {
        console.error("Home Route Error:", err);
        res.status(500).send(err.message);
    }
});

// User routes handle auth pages; blog routes handle blog creation/details.
app.use('/user', userRoute);
app.use('/blog', BlogRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
