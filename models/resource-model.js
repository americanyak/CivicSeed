module.exports = function(mongoose, db, Schema, ObjectId) {

	var resourceSchema = new Schema({
		id: Number,
		kind: String,
		url: String,
		tagline: String,
		prompt: String,
		question: String,
		answer: String,
		responses: [String],
		shape: {
			path: String,
			fill: String,
			stroke: String
		}
	});

	var ResourceModel = db.model('resource', resourceSchema, 'resources');

	return ResourceModel;

};