var mongoose = require("mongoose");

// schema setup
var recipeSchema = new mongoose.Schema({
	name: String,
	time: String,
	image: String,
	description: String,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
         	ref: "Comment"
		}
	]
});
	

module.exports = mongoose.model("Recipe", recipeSchema);
