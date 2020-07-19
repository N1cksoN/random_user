const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserSchema = new Schema({
	id: {
		type: String,
		required: true
	},
	// username: {
	// 	type: String,
	// },
	firstName: {
	 	type: String,
	 	required: true
  },
	// lastName: {
	// 	type: String,
	// 	required: true
	// },
	chatId: {
		type: String,
		required: true
	},
	pidorCount: {
		type: Number
	},
	pidorDate: {
		type: String
	}
});

mongoose.model('user', UserSchema);