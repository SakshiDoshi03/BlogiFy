const {Router} = require('express');
const user = require('../models/usermod');
const router = Router();
const multer = require('multer');
const path = require('path');

// Store uploaded profile images inside public/uploads.
const diskstorage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, path.resolve(`./public/uploads`));
    },
    filename: function(req,file,cb){
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: diskstorage });

// Show the signin form.
router.get('/signin', (req,res) => {
    return res.render('signin');
});

// Check submitted signin credentials against the User model.
router.post('/signin', async (req,res) => {
    const {email, password} = req.body;

    try {
        const match = await user.matchPasswordandGenerateToken(email, password);
        console.log("User", match);
     
        return res.cookie("token", match.token).redirect("/");
    } catch (error) {
        return res.render('signin',{
            error: "Invalid email or password"
        });
        // console.error("Signin failed:", error.message);
        // return res.status(401).send(error.message);
    }
});

// Show the signup form.
router.get('/signup', (req,res) => {
    return res.render('signup');
});

// Create a new user account from signup form data.
router.post('/signup', async (req,res) => {
    const {fullName, email, password} = req.body;

    try {
        await user.create({
            fullName,
            email,
            password
        });

        return res.redirect("signin");
    } catch (error) {
        console.error("Signup failed:", error.message);
        return res.status(400).send("Unable to create user");
    }
});

// Clear the auth cookie so the user becomes logged out.
router.get('/logout', (req,res) => {
    return res.clearCookie("token").redirect("/");
})

router.get('/edit/:id', async(req,res) => {
    const profileUser = await user.findById(req.params.id);

    if(!profileUser){
        return res.status(404).send("User not found");
    }

    return res.render('editprofile', {
        user: req.user,
        profileUser
    })
})

router.post('/edit/:id', upload.single('profileImage'), async(req,res) => {
    const profileUser = await user.findById(req.params.id);
    if(!profileUser){
        return res.status(404).send("User not found");
    }
    
    if(!req.user || profileUser._id.toString() !== req.user._id.toString()){
        return res.status(403).send("Unauthorized");
    }


    const {fullName, email} = req.body;
    const updatedData = {
        fullName,
        email
    }
    if(req.file){
        updatedData.profileImgUrl = `/uploads/${req.file.filename}`;
    }
    await user.findByIdAndUpdate(req.params.id, updatedData);
    return res.redirect(`/user/${req.params.id}`);
})

router.get('/:id', async(req,res) => {
    const profileUser = await user.findById(req.params.id);

    if(!profileUser){
        return res.status(404).send("User not found");
    }

    return res.render('myprofile', {
        user: req.user,
        profileUser
    })
})



module.exports = router;
