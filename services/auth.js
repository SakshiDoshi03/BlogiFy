const JWT = require('jsonwebtoken');
const secret = "$ecretKeyForJWTGeneration";

// Create a JWT with only the user details needed by the app.
function createtokenforuser(user){
    const payload ={
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileImgUrl: user.profileImgUrl
    };
    const token = JWT.sign(payload, secret);
    return token;
}

// Verify a JWT from the cookie and return its payload.
function validatetoken(token){
    const payload = JWT.verify(token,secret);
    return payload;
}

module.exports = {
    createtokenforuser,
    validatetoken
}
