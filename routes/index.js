 var express = require("express"),
  	router = express.Router(),
	passport = require("passport"),
	User = require("../models/user"),
	Recipe = require("../models/recipe"),
	async = require("async"),
	nodemailer = require("nodemailer"),
	crypto = require("crypto"); // is part of Node, no need to install this, just require it 

// root route
router.get("/", function(req, res){
	res.render("landing");
});

// AUTHENTICATE ROUTE

// show the register form
router.get("/register", function(req, res){
	res.render("register", {page: 'register'});
})
// handle sign up logic
router.post("/register", function(req, res){
	var newUser = new User(
		{
			username: req.body.username, 
			avatar: req.body.avatar,
			firstName: req.body.firstName, 
			lastName: req.body.lastName,
			email: req.body.email
		});
	if(req.body.adminCode === "secret code"){
		newUser.isAdmin = true;
	}
	// Automatically abandon same usernames
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			return res.render("register", {error: err.message});
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome to join Foodies' Zone, " + req.body.username);
			res.redirect("/recipes");
		});
	});
});

// show login form
router.get("/login", function(req, res){
	res.render("login", {page: 'login'});
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


//forgot route
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([ // waterfall is an array of functions that get called one after another
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.'); // the email must exits in the database
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'pwxwq214@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'pwxwq214@gmail.com',
        subject: "Reset Your Password at Foodies' Zone",
        text: "You are receiving this because you (or someone else) have requested the reset of the password for your account at Foodies' Zone.\n\n" +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// RESET ROUTE
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'pwxwq214@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'pwxwq214@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          "This is a confirmation that the password for your account at Foodies's Zone" + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/recipes');
  });
});


// USER PROFILE ROUTE
router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if (err){
			req.flash("error", "Something went wrong");
			res.redirect("/");
		}
		Recipe.find().where("author.id").equals(foundUser._id).exec(function(err, foundRecipes){
			if (err){
				req.flash("error", "Something went wrong");
				res.redirect("/");
			}
			res.render("users/show", {user: foundUser, recipes: foundRecipes}); // pass in user object
		})
		
	});
});



module.exports = router;
