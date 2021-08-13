const keystone = require('../../ks');
const Config = keystone.list('Config').model;

exports = module.exports = async function (req, res) {
	let env = req.param('env');
	try {
		let settings = {};
		// master all level
		(await Config.find({isPublic: true, environment: 'all'}, {
			createdBy: 0,
			createdAt: 0,
			updatedBy: 0
		})).forEach(setting => {
			settings[setting.name] = setting;
		});
		// override with specific env
		if (env && env.length) {
			(await Config.find({isPublic: true, environment: env}, {
				createdBy: 0,
				createdAt: 0,
				updatedBy: 0
			})).forEach(setting => {
				settings[setting.name] = setting;
			});
		}
		res.end(JSON.stringify({config: settings, success: true, code: 200}));
	} catch (c) {
		console.log(err);
		res.end(JSON.stringify({error: c.message, success: false, code: 500}));
	}
};
