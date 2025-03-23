if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://localhost:27017/your_local_db";

async function connectDB() {
    try {
        await mongoose.connect(dbUrl);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
}
connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// 🚀 Middleware to ignore favicon requests
app.use((req, res, next) => {
    if (req.url === "/favicon.ico") {
        return res.status(204).end(); // No Content response
    }
    next();
});

// 🛠 Session Store (MongoDB)
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: process.env.SECRET || "fallbacksecret" },
    touchAfter: 24 * 3600, // Reduce session writes
});

store.on("error", (err) => {
    console.error("❌ Error in Mongo Session Store:", err);
});

// 🛠 Session Configuration
const sessionOptions = {
    store,
    secret: process.env.SECRET || "fallbacksecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// 🛠 Fix: Debugging session persistence
app.use((req, res, next) => {
    console.log("👤 Current User from Session:", req.session.passport?.user || "No user");
    res.locals.currUser = req.user || null;
    next();
});

// 🛠 Privacy and Terms Pages
app.get('/privacy', (req, res) => {
    res.send('<h1>Privacy Policy</h1><h4>Work in progress.....</h4><h4><a href="/">Back to Home</a></h4>');
});
app.get('/terms', (req, res) => {
    res.send('<h1>Terms & Conditions</h1><h4>Work in progress.....</h4><h4><a href="/">Back to Home</a></h4>');
});

// 🛠 Fix: Register routes properly
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter); // ✅ Used userRouter instead of repeating listingRouter

// 🛠 Handle 404 errors
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// 🛠 Global Error Handler
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { err });
});

// 🛠 Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
