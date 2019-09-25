var Recipe = require("../models/recipe");
var Comment = require("../models/comment");

// all middleware goes here
var middlewareObj = {};

middlewareObj.checkRecipeOwnership = function(req, res, next){
	if (req.isAuthenticated()){
		Recipe.findById(req.params.id, function(err, foundRecipe){
			if (err || !foundRecipe){
				req.flash("error", "Recipe not found!");
				res.redirect("back");
			} else {
				if (foundRecipe.author.id.equals(req.user._id)){
					next();
				} else {
					req.flash("error", "Only creaters can edit the recipe!");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to login first!");
		res.redirect("back");
	}	
}

middlewareObj.checkCommentOwnership = function(req, res, next){
	if (req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if (err || !foundComment){
				req.flash("error", "Comment not found!");
				res.redirect("back");
			} else {
				if (foundComment.author.id.equals(req.user._id)){
					next();
				} else {
					req.flash("error", "Only authors can edit the comment!");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to login first!");
		res.redirect("back");
	}	
}

middlewareObj.isLoggedIn = function(req, res, next){
	if (req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Login to Share!"); // alert should be green; one-time thing, must be put before redirect
	res.redirect("/login");
}


module.exports = middlewareObj;