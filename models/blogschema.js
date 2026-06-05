const {Schema, model} = require('mongoose');

// Blog schema stores post content, cover image data, and author reference.
const blogSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    body:{
        type:String,
        required:true
    },
    coverImage:{
        data: Buffer,
        contentType: String,
    },
    // Each liked user is stored once, so the app can show active likes and unlike.
    likes:[{
        type: Schema.Types.ObjectId,
        ref:'user',
    }],
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:'user',
        required:true
    }
}, {timestamps:true});


// Export the Blog model so routes can create and read blog posts.
const blog = model('blog', blogSchema);
module.exports = blog;
