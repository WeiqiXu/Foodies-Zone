var express = require("express");
var router = express.Router();
var Recipe = require("../models/recipe");
var Review = require("../models/review");
var middleware = require("../middleware"); // will automatically require "index.js" file, which is a special name
var mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);

// multer and cloudinary configuration
var multer = require("multer");
var storage = multer.diskStorage({
	filename: function(req, file, callback) {
		callback(null, Date.now() + file.originalname);
	}
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
	cloud_name: 'weiqi', 
	api_key: 954666166992279, 
	api_secret: process.env.CLOUDINARY_API_SECRET
});


// INDEX ROUTE: show all recipes
router.get("/", function(req, res){
	var noMatch = null;
	// if receives a search request
	if (req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Recipe.find({name: regex}, function(err, allRecipes){
			if(err){
				console.log(err);
			} else {
				
				if(allRecipes.length < 1) {
                	noMatch = "No recipe match that query, please try again.";
              	}
				res.render("recipes/index", {recipes: allRecipes, noMatch: noMatch});
			}
		});
	} else {
		// get all recipes from DB
		Recipe.find({}, function(err, allRecipes){
			if(err){
				console.log(err);
			} else {
				res.render("recipes/index", {recipes: allRecipes, page: 'recipes', noMatch: noMatch});
			}
		});
	}
});

// CREATE ROUTE
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
	// get data from form and add to recipes array -- create a new recipe
	// var name = req.body.name;
	// var time = req.body.time;
	// var image = req.body.image;
	// var desc = req.body.description;
	// var author = {
	// 	id: req.user._id,
	// 	username: req.user.username
	// }
	// var newRecipe = {name: name, time: time, image: image, description: desc, author: author};
	// // create a new recipe and save to DB
	// Recipe.create(newRecipe, function(err, newlyCreated){
	// 	if (err){
	// 		console.log(err);
	// 	} else{
	// 		// redirect back to recipes page
	// 		req.flash("success", "Your recipe is successfully created!");
	// 		res.redirect("/recipes");
	// 	}
	// });
	cloudinary.uploader.upload(req.file.path, function(result) {
  	// add cloudinary url for the image to the recipe object under image property
		req.body.recipe.image = result.secure_url;
		// add author
		req.body.recipe.author = {
			id: req.user._id,
			username: req.user.username
		}
		Recipe.create(req.body.recipe, function(err, recipe) {
			if (err) {
				req.flash("error", err.message);
				return res.redirect("back");
			} else {
				req.flash("success", "Your recipe is successfully created!");
				res.redirect("/recipes/" + recipe.id);
			}
		});
	});
});

// NEW ROUTE: show the form that will send the data to the post route
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("recipes/new");
})

// SHOW ROUTE: show details about a recipe
// note: should be put after NEW ROUTE
router.get("/:id", function(req, res){
	// find recipe with provided id
	Recipe.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, foundRecipe){
		if (err || !foundRecipe){
			req.flash("error", "Recipe not found!");
			console.log(err);
			res.redirect("back");
		} else {
			res.render("recipes/show", {recipe: foundRecipe});
		}
	});
});

// EDIT RECIPE ROUTE
router.get("/:id/edit", middleware.checkRecipeOwnership, function(req, res){
	Recipe.findById(req.params.id, function(err, foundRecipe){ // shouldn't exit err at this point, checked in the middleware
		res.render("recipes/edit", {recipe: foundRecipe});
	});
});


// UPDATE RECIPE ROUTE
router.put("/:id", middleware.checkRecipeOwnership, function(req, res){
	// find and update the correct recipe
	Recipe.findByIdAndUpdate(req.params.id, req.body.recipe, function(err, updatedRecipe){
		if (err){
			res.redirect("/recipes");
		} else {
			// redirect
			req.flash("success", "Recipe updated successfully!");
			res.redirect("/recipes/" + req.params.id);
		}
	});
	
});

//DESTROY RECIPE ROUTE
router.delete("/:id", middleware.checkRecipeOwnership, function(req, res){
	Recipe.findByIdAndRemove(req.params.id, function(err, recipe){
		if (err){
			res.redirect("/recipes");
		} else {
			Comment.remove({"_id": {$in: recipe.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/recipes");
                }
                // deletes all reviews associated with the recipe
                Review.remove({"_id": {$in: recipe.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/recipes");
                    }
                    //  delete the recipe
                    recipe.remove();
                    req.flash("success", "Recipe deleted successfully!");
                    res.redirect("/recipes");
                });
            });
		}
	});
});

// decoration for fuzzy search
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"); // match any chars globally
};

module.exports = router;
 