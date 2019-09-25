var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

// root route
router.get("/", function(req, res){
	res.render("landing");
});

// AUTHENTICATE ROUTE

// show the register form
router.get("/register", function(req, res){
	res.render("register");
})
// handle sign up logic
router.post("/register", function(req, res){
	var newUser = new User({username: req.body.username});
	// Automatically abandon same usernames
	User.register(newUser, req.body.password, function(err, user){
		if (err){
			console.log(err);
			req.flash("error", err.message);
			return res.render("register"); // return to get out of the call back. 
		} 
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome to join Foodies' Zone, " + user.username);
			res.redirect("recipes");
		});
	});
});

// show login form
router.get("/login", function(req, res){
	res.render("login");
});

// handle login logic
// use the middleware --> app.post("/login", middleware, callback)
router.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/recipes", 
		failureRedirect: "/login"
	}), function(req, res){
});


// log out route
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged you out!");
	res.redirect("/recipes");
})

// middleware
function isLoggedIn(req, res, next){
	if (req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

module.exports = router;
