const keystone = require('../../ks');
const Config = keystone.list('Config').model;

exports = module.exports = async function (req, res) {
	if (!req._user) return res.end(JSON.stringify({error: 'Unauthorized', success: false, code: 401}));
	let env = req.param('env');
	let keys = req.param('keys');
	console.log({env, keys}, req._user);
	// todo check in table if env authorized
	try {
		let settings;
		// master all level
		settings = await Config.find({name: {$in: keys}, environment: {$in: [...env, 'all']}}, {
			createdBy: 0,
			createdAt: 0,
			updatedBy: 0
		});
		res.end(JSON.stringify({config: settings, success: true, code: 200}));
	} catch (c) {
		console.log(c);
		res.end(JSON.stringify({error: c.message, success: false, code: 500}));
	}
};
