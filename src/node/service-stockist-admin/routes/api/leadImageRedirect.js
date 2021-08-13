const keystone = require('../../ks');

exports = module.exports = async function (req, res) {
	const LeadImage = keystone.list('LeadImage').model;

	let slug = req.param('slug');
	try {
		let image = await LeadImage.find({slug: slug}).sort({updatedAt: -1}).limit(1);
		image = image.shift();
		if (image) {
			res.redirect(image.image.secure_url)
		} else {
			res.end('No such Image');
		}
	} catch (c) {
		console.log(c);
		res.end('Unknown slug or not able to connect to the database. Please talk to tech team.');
	}
};
