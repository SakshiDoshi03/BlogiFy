const { validatetoken } = require("../services/auth");

// Middleware factory checks one cookie name and loads the user payload.
function checkforauthenticationcookie(cookiename){
    return(req, res, next) => {
        const tokencookievalue = req.cookies[cookiename];
        // No cookie means the visitor is public, so continue without req.user.
        if(!tokencookievalue){
            return next();
        }

        try{
            // A valid JWT becomes req.user for routes and EJS templates.
            const userPayload = validatetoken(tokencookievalue);
            req.user = userPayload;
        }
        catch(error){
            return res.status(401).send("Unauthorized: Invalid token");
        }
        return next();
        
    }
}

module.exports = {
    checkforauthenticationcookie
}
