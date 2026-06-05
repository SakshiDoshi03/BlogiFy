const {Router} = require('express');
const blog = require('../models/blogschema');
// Comment model is used to save and show comments on each blog detail page.
const commentModel = require('../models/commentsmodel');

const router = Router();
const multer = require('multer');
const path = require('path');

// Store uploaded cover images inside public/uploads.
const diskstorage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, path.resolve(`./public/uploads`));
    },
    // Add a timestamp so uploaded files do not overwrite each other.
    filename: function(req,file,cb){
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
})

const upload = multer({ storage: diskstorage });

// Show the form for creating a new blog post.
router.get('/addblog', (req,res) => {
    return res.render('addblog', {
        user: req.user
    });
});

// Save the submitted blog and optional cover image.
router.post('/', upload.single('coverImage'), async (req,res)=>{
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
        coverImgUrl: req.file ? `/uploads/${req.file.filename}` : null,
        createdBy: req.user._id,
    })
    return res.redirect(`/blog/${Blog._id}`);
})

router.get('/myblogs', async(req,res) => {
    const blogs = await blog.find({createdBy: req.user._id});
    return res.render('myblogs', {
        user: req.user,
        blogs: blogs
    });
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
    const Blog = await blog.findById(req.params.id).populate('createdBy');
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

router.post('/edit/:id', upload.single('coverImage'), async(req,res)=>{
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
        updatedData.coverImgUrl = `/uploads/${req.file.filename}`;
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
