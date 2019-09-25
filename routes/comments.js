 var express = require("express");
var router = express.Router({mergeParams: true}); // merge params of comments and recipes, s.t. in the comment route we can access the ":id" we defined.
var Recipe = require("../models/recipe");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);

// COMMENTS ROUTE
// comment new
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find recipe by id
    Recipe.findById(req.params.id, function(err, recipe){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {recipe: recipe});
        }
    })
});
// comment create
router.post("/", middleware.isLoggedIn, function(req, res){
   //lookup recipe using ID
   Recipe.findById(req.params.id, function(err, recipe){
       if(err){
           console.log(err);
           res.redirect("/recipes");
       } else {
		// create new comment
        Comment.create(req.body.comment, function(err, comment){
           if(err){
			   req.flash("error", "Something went wrong...");
               console.log(err);
           } else {
			   // connect new comment to recipe
			   // add username and id
			   comment.author.id = req.user._id;
			   comment.author.username = req.user.username;
			   comment.save();
			   recipe.comments.push(comment);
               recipe.save();
			   // redirect to show page
			   req.flash("success", "Comment successfully added!");
               res.redirect('/recipes/' + recipe._id);
           }
        });
       }
   });
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
	Recipe.findById(req.params.id, function(err, foundRecipe){
		if (err || !foundRecipe){
			req.flash("error", "No recipe found");
			return res.redirect("back");
		}
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if (err){
				res.redirect("back");
			} else {
				res.render("comments/edit", {recipe_id: req.params.id, comment: foundComment});
			}
		});
	})
	
});

// COMMENT UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	// model.findByIdAndUpdate(id to find by, data to update with, callback function to run afterwards)
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if (err){
			res.redirect("back");
		} else{
			res.redirect("/recipes/" + req.params.id);
		}
	});
});

//COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if (err){
			res.redirect("back");
		} else {
			req.flash("success", "Comment successfully deleted!");
			res.redirect("/recipes/" + req.params.id); // send back to the show page
		}
	});
});


module.exports = router;