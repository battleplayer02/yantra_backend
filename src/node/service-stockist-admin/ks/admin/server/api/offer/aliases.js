const keystone = require('../../../../');
module.exports = (req, res) => {
	const Customer = keystone.list('Customer').model;

	Customer
		.find({
			alias: req.params.customerId
		})
		.populate('car')
		.populate('dealerOutlet')
		.populate('dealership')
		.exec((err, aliases) => {
			if (err) console.log(err);
			res.send(aliases);
		})
};
