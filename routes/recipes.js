var express = require("express");
var router = express.Router();
var Recipe = require("../models/recipe");
var middleware = require("../middleware"); // will automatically require "index.js" file, which is a special name
var mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);

// INDEX ROUTE: show all recipes
router.get("/", function(req, res){
	// get all recipes from DB
	Recipe.find({}, function(err, allRecipes){
		if(err){
			console.log(err);
		} else {
			res.render("recipes/index", {recipes: allRecipes});
		}
	});
});

// CREATE ROUTE
router.post("/", middleware.isLoggedIn, function(req, res){
	// get data from form and add to recipes array -- create a new recipe
	var name = req.body.name;
	var time = req.body.time;
	var image = req.body.image;
	var desc = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	var newRecipe = {name: name, time: time, image: image, description: desc, author: author};
	// create a new recipe and save to DB
	Recipe.create(newRecipe, function(err, newlyCreated){
		if (err){
			console.log(err);
		} else{
			// redirect back to recipes page
			req.flash("success", "Your recipe is successfully created!");
			res.redirect("/recipes");
		}
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
	Recipe.findById(req.params.id).populate("comments").exec(function(err, foundRecipe){
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
	Recipe.findByIdAndRemove(req.params.id, function(err){
		if (err){
			res.redirect("/recipes");
		} else {
			req.flash("success", "Recipe deleted successfully!");
			res.redirect("/recipes");
		}
	});
});



module.exports = router;
 