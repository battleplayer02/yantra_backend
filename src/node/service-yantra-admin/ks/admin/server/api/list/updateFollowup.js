const keystone = require('../../../../');
const Followup = keystone.list('Followup');

exports = module.exports = function (req, res) {
	console.log('followup req.body!', req.body, req.params.id);

	const followupId = req.params.id;

	if (!followupId) return res.json({status: 'id is required'});

	let update = {
		markedAsDoneAt: new Date()
	};

	if (req.body.comments && req.body.comments.trim()) {
		update.comments = req.body.comments.trim();
	}

	Followup.model.update({_id: followupId}, update, function (err, _user) {
		if (err) {
			return res.status(500).json({
				err: 'database error',
				detail: err
			});
		}
		res.json({status: true});
	});
};
