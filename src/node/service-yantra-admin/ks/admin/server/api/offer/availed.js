const keystone = require('../../../../');
module.exports = (req, res) => {
	const followUp = keystone.list('Followup').model;
	const UserMergeRequest = keystone.list('UserMergeRequest').model;

	// find aliases customer ids, and add in query
	UserMergeRequest.findOne({parent: req.params.customerId}, (err, mr) => {
		if(err) console.log(err);
		const ids = [];
		if(mr && mr.children) {
			mr.children.forEach(id => ids.push(id));
		}
		ids.push(req.params.customerId);
		const query = {
			offerAvailed: 'Yes'
		};
		if(ids.length > 1) query.customer = {$in: ids};
		else query.customer = ids.shift();
		console.log(query);
		followUp
			.find(query)
			.populate('offer')
			.populate('createdBy')
			.sort({createdAt: -1})
			.exec((err, offers) => {
				res.send(offers);
			})
	});
};
