var mongoose = require("mongoose");
var Recipe = require("./models/recipe");
var Comment   = require("./models/comment");
 

var recipes = [
	{
		name: "Mapo Toufu", 
		image: "http://www.pbs.org/food/wp-content/blogs.dir/2/files/2011/10/mapo-tofu-hp.jpg", 
		description: "Best companion with rice!"
	},
	{
		name: "dumplings", 
		image: 	"https://www.thespruceeats.com/thmb/cmx14OHMIIBjuQKrs_Mx4IGpbSA=/960x0/filters:no_upscale():max_bytes(150000):strip_icc()/chinese-pan-fried-dumplings-694499_hero-01-f8489a47cef14c06909edff8c6fa3fa9.jpg", 
		description: "Favorite dish of people living in the north."
	},
	{
		name: "fried rice", 
		image:"https://www.jessicagavin.com/wp-content/uploads/2018/09/fried-rice-7-600x900.jpg", 
		description: "Quick meal No. 1" 
	}
]

 
function seedDB(){
   //Remove all recipes
   Recipe.deleteMany({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed recipes!");
        Comment.deleteMany({}, function(err) {
            if(err){
                console.log(err);
            }
            console.log("removed comments!");
             //add a few recipes
            recipes.forEach(function(seed){
                Recipe.create(seed, function(err, recipe){
                    if(err){
                        console.log(err)
                    } else {
                        console.log("added a recipe");
                        //create a comment
                        Comment.create(
                            {
                                text: "Very tasty, but difficult to make",
                                author: "piggy"
                            }, function(err, comment){
                                if(err){
                                    console.log(err);
                                } else {
                                    recipe.comments.push(comment);
                                    recipe.save();
                                    console.log("Created new comment");
                                }
                            });
                    }
                });
            });
        });
    }); 
}
 
module.exports = seedDB;