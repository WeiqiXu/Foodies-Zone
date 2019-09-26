var Recipe = require("../models/recipe");
var Comment = require("../models/comment");
var Review = require("../models/review");

// all middleware goes here
var middlewareObj = {};

middlewareObj.checkRecipeOwnership = function(req, res, next){
	if (req.isAuthenticated()){
		Recipe.findById(req.params.id, function(err, foundRecipe){
			if (err || !foundRecipe){
				req.flash("error", "Recipe not found!");
				res.redirect("back");
			} else {
				if (foundRecipe.author.id.equals(req.user._id) || req.user.isAdmin){
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
				if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
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

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Recipe.findById(req.params.id).populate("reviews").exec(function (err, foundRecipe) {
            if (err || !foundRecipe) {
                req.flash("error", "Recipe not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundRecipe.reviews
                var foundUserReview = foundRecipe.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/recipes/" + foundRecipe._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};


middlewareObj.isLoggedIn = function(req, res, next){
	if (req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Login to Share!"); // alert should be green; one-time thing, must be put before redirect
	res.redirect("/login");
}


module.exports = middlewareObj;