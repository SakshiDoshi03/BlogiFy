const {Schema, model} = require('mongoose');

// Comment schema stores each comment separately and links it to a blog and user.
const commentSchema = new Schema({
    content:{
        type:String,
        required:true
    },
    // blogId connects this comment to the blog page where it should be shown.
    blogId:{
        type:Schema.Types.ObjectId,
        ref:'blog',
    },
    // createdBy connects this comment to the user who wrote it.
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:'user',
    }
}, {timestamps:true});

// Export the Comment model so routes can create and list comments.
const comment = model('comment', commentSchema);
module.exports = comment;
