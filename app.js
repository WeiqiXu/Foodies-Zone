require('dotenv').config();
var express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	flash = require("connect-flash"),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	Recipe = require("./models/recipe"),
	Comment = require("./models/comment"),
	User = require("./models/user"),
	seedDB = require("./seeds");

// requiring route
var commentRoutes = require("./routes/comments"),
	reviewRoutes = require("./routes/reviews"),
	recipeRoutes = require("./routes/recipes"),
	indexRoutes = require("./routes/index");

// CREATE A DATABASE
// connect to local db
mongoose.connect("mongodb://localhost:27017/FoodiesZone", {useNewUrlParser: true, useUnifiedTopology: true}); 
// connect to MongoDB Atlas
const password = process.env.MONGOOSEPASSWORD;
// mongoose.connect("mongodb+srv://Weiqi:"+password+"@cluster0-oykae.mongodb.net/test?retryWrites=true&w=majority", {
// 		useNewUrlParser: true,
// 		useCreateIndex: true,
// 		useUnifiedTopology: true
// 	}).then(() => {
// 		console.log("connected to MongoDB Atlas!");
// 	}).catch(err => {
// 		console.log("ERROR", err.message);
// 	});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public")); // is safer to add __dirname
app.use(methodOverride("_method"));
app.use(flash()); // must be put before passport configuration
// seedDB();

// enable moment in all of view files via variable named moment.
app.locals.moment = require("moment");

// PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "xixixi",
	resave: false,
	saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// define a middleware: whatever function we provide to it, it'll be called on all the routes
// available on all template and routes
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next(); // move on to next middleware, which can be the real route handler
});

app.use("/", indexRoutes);
app.use("/recipes", recipeRoutes);
app.use("/recipes/:id/comments", commentRoutes);
app.use("/recipes/:id/reviews", reviewRoutes);

app.listen(process.env.PORT || 3000, process.env.IP, function(){
	console.log("My blog has started !!!");
});
