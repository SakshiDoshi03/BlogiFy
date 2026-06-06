# BlogSite (Blogify)

A simple blogging platform built with Node.js, Express, EJS and MongoDB. Users can sign up, create and manage blog posts, add comments, and upload images.

Live demo: https://blogify-sv94.onrender.com

## Features

- User registration and authentication
- Create, edit, delete blog posts
- Upload images for posts
- Comment on posts
- User profile with editable information
- Middleware-protected routes for authenticated actions

## Tech stack

- Node.js
- Express
- EJS templates
- MongoDB / Mongoose
- Multer for file uploads

## Quick Start

Prerequisites:

- Node.js (>= 16)
- MongoDB (local or Atlas)

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root with the following values:

- `PORT` - (optional) port to run the server (default 3000)
- `MONGO_URI` - MongoDB connection string
- `SESSION_SECRET` - session signing secret

Example `.env`:



Run the app:

```bash
npm start
# or during development
npm run dev
```


## Project Structure

- `app.js` - application entrypoint and middleware setup
- `controllers/` - route handlers
- `models/` - Mongoose schemas (blogs, users, comments)
- `routes/` - Express routes
- `services/` - authentication and helper logic
- `middleware/` - auth middleware
- `public/` - static assets and uploaded images
- `views/` - EJS templates

## Important Files

- `controllers/` — request handlers for blog and user actions
- `models/blogschema.js`, `models/usermod.js`, `models/commentsmodel.js` — data schemas
- `routes/blogroute.js`, `routes/userroute.js` — route definitions
- `middleware/authmiddle.js` — protects private routes

## Endpoints (high level)

- `GET /` — home page with recent posts
- `GET /auth/signup`, `POST /auth/signup` — register
- `GET /auth/signin`, `POST /auth/signin` — login
- `GET /blogs/new`, `POST /blogs` — create blog (auth)
- `GET /blogs/:id/edit`, `PUT /blogs/:id` — edit blog (auth/owner)
- `DELETE /blogs/:id` — delete blog (auth/owner)
- `POST /blogs/:id/comments` — add comment (auth)

Refer to the route files in `routes/` for full details.

## Notes

- Uploaded files are stored in `public/uploads` (or `uploads/`) — ensure the folder is writable.
- The project uses sessions; set a strong `SESSION_SECRET` for production.

## Contributing

Feel free to open issues or submit pull requests. If adding features, include tests and update the README documentation.


