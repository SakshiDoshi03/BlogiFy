const {Router} = require('express');
const blog = require('../models/blogschema');
// Comment model is used to save and show comments on each blog detail page.
const commentModel = require('../models/commentsmodel');

const router = Router();
const multer = require('multer');
const mongoose = require('mongoose');

// Keep cover image uploads in memory so they can be saved directly to MongoDB.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: function(req, file, cb){
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    }
});

function uploadCoverImage(req, res, next){
    upload.single('coverImage')(req, res, function(err){
        if (err) {
            return res.status(400).send(err.message);
        }
        next();
    });
}

// Show the form for creating a new blog post.
router.get('/addblog', (req,res) => {
    return res.render('addblog', {
        user: req.user
    });
});

// Save the submitted blog and optional cover image.
router.post('/', uploadCoverImage, async (req,res)=>{
    try {
        if (!req.user) {
            return res.redirect('/user/signin');
        }

        const {title, body}  = req.body;

        if (!title || !body || !req.file) {
            return res.render('addblog', {
            user: req.user,
            error: 'All fields are required',
            });
        }

        const Blog = await blog.create({
            title,
            body,
            coverImage: {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            },
            createdBy: req.user._id,
        });
        return res.redirect(`/blog/${Blog._id}`);
    } catch (err) {
        console.error('Create blog error:', err);
        return res.status(500).send('Unable to create blog');
    }
})

router.get('/myblogs', async(req,res) => {
    const blogs = await blog.find({createdBy: req.user._id}).select('-coverImage.data');
    return res.render('myblogs', {
        user: req.user,
        blogs: blogs
    });
})

// Serve a blog cover image from MongoDB instead of Render's temporary filesystem.
router.get('/image/:id', async (req,res) =>{
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send('Invalid blog id');
        }

        const Blog = await blog.findById(req.params.id).select('coverImage');

        if(!Blog){
            return res.status(404).send('Blog not found');
        }

        if(!Blog.coverImage || !Blog.coverImage.data || Blog.coverImage.data.length === 0){
            return res.status(404).send('Image not found');
        }

        res.set('Content-Type', Blog.coverImage.contentType || 'application/octet-stream');
        return res.send(Blog.coverImage.data);
    } catch (err) {
        console.error('Blog image error:', err);
        return res.status(500).send('Unable to load image');
    }
})

// Delete a blog post. Only the author can delete their blog.
router.post('/:id/delete', async (req,res) =>{
    const Blog = await blog.findById(req.params.id);
    if(!Blog){
        return res.status(404).send('Blog not found');
    }
    // Only the author of the blog can delete it.
    if(Blog.createdBy.toString() !== req.user._id.toString()){
        return res.status(404).send('Blog Not Found');
    }

    if(!req.user || Blog.createdBy.toString() !== req.user._id.toString()){
        return res.status(403).send('Unauthorized');
    }

    await blog.findByIdAndDelete(req.params.id);
    return res.redirect('/');
})

// Show one blog post with its author and comments.
router.get('/:id', async (req,res) =>{
    const Blog = await blog.findById(req.params.id).select('-coverImage.data').populate('createdBy');
    // Load only comments for this blog and populate each comment's author details.
    const comments = await commentModel.find({blogId: req.params.id}).populate('createdBy');
    if(!Blog){
        return res.status(404).send('Blog not found');
    }
    else{
        return res.render("blog",{
            user: req.user,
            blog: Blog,
            comments: comments
        });
    }
})

router.get('/edit/:id', async(req,res)=>{
    const Blog = await blog.findById(req.params.id);
    if(!Blog){
        return res.status(404).send('Blog not found');
    }
    // Only the author of the blog can edit it.
    if(Blog.createdBy.toString() !== req.user._id.toString()){
        return res.status(404).send('Blog Not Found');
    }
    return res.render('editblog',{
        user: req.user,
        blog: Blog
    });
});

router.post('/edit/:id', uploadCoverImage, async(req,res)=>{
    const Blog = await blog.findById(req.params.id);
    if(!Blog){
        return res.status(404).send('Blog not found');
    }
    const {title, body} = req.body;
    // Only the author of the blog can edit it.
    if(Blog.createdBy.toString() !== req.user._id.toString()){
        return res.status(404).send('Blog Not Found');
    }
    const updatedData = {
        title,
        body,
    };

    if(req.file){
        updatedData.coverImage = {
            data: req.file.buffer,
            contentType: req.file.mimetype,
        };
    }

    await blog.findByIdAndUpdate(req.params.id, updatedData);
    return res.redirect(`/blog/${req.params.id}`);
})



// Save a new comment for a blog, then return to the same blog page.
router.post('/comment/:blogId', async (req,res) =>{
    await commentModel.create({
        content: req.body.content,
        blogId: req.params.blogId,
        createdBy: req.user._id
    })
    return res.redirect(`/blog/${req.params.blogId}`);
})

router.post('/like/:id', async (req, res) => {
    // Send the user back to the page where they clicked like/unlike.
    const redirectTo = req.get('Referrer') || '/';

    if (!req.user) {
        return res.redirect('/user/signin');
    }

    const Blog = await blog.findById(req.params.id);

    if (!Blog) {
        return res.status(404).send('Blog not found');
    }

    if (Blog.createdBy.toString() === req.user._id.toString()) {
        return res.redirect(redirectTo);
    }

    // Older blog documents may not have a likes array yet.
    if (!Array.isArray(Blog.likes)) {
        Blog.likes = [];
    }

    // If the current user's id is already in likes, this click means unlike.
    const alreadyLiked = Blog.likes.some(
        userId => userId.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
        // Remove only the current user's id and keep other users' likes.
        Blog.likes = Blog.likes.filter(
            userId => userId.toString() !== req.user._id.toString()
        )
    } else{
        // Add this user id so the button can stay active for this user later.
        Blog.likes.push(req.user._id);
    }

    await Blog.save();

    return res.redirect(redirectTo);
});



module.exports = router;
