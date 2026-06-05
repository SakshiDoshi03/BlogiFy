const { Schema, model } = require('mongoose');
const {createHmac, randomBytes} = require('crypto');
const {createtokenforuser} = require('../services/auth');


// User schema stores account details plus auth-related fields.
const userSchema = new Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    salt :{
        type:String
    },
    password:{
        type:String,
        required:true
    },
    profileImgUrl:{
        type:String,
        default:'/img/profileimg.png'
    },
    role:{
        type:String,
        enum:['Admin','User'],
        default:'User'
    }
} ,{timestamps:true});

// Hash a new or changed password before saving the user document.
userSchema.pre('save', function(){
    const user = this;

    if (!user.isModified('password')) {
        return;
    }

    const salt = randomBytes(16).toString('hex');
    const hash = createHmac('sha256', salt)
    .update(user.password)
    .digest('hex');

    this.salt = salt;
    this.password = hash;
});

// Compare a plain login password with the stored hashed password.
userSchema.statics.matchPasswordandGenerateToken = async function(email, password){
    const user = await this.findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }

    const inputhash = createHmac('sha256', user.salt)
    .update(password)
    .digest('hex');

    if (user.password !== inputhash) {
        throw new Error("Invalid password");
    }

    const token = createtokenforuser(user);
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.salt;

    return { ...userObject, isMatch: true, token };
};

// Export the Mongoose model so routes can create and find users.
const user = model('user', userSchema);

module.exports = user;
