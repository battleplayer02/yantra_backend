const keystone = require('../ks');

exports = module.exports = class ConfigHistoryService {

	static async registerConfigUpdate(isNew, object) {
		// lazy include because of loader issue
		const ConfigChangeHistory = keystone.list('ConfigChangeHistory').model;
		const Config = keystone.list('Config').model;
		const AdminUser = keystone.list('AdminUser').model;
		// no need to track new ones.
		if (isNew) return;
		const dirtyFields = object.modifiedPaths();
		console.log('dirty fields', dirtyFields);
		let systemAdmin = await AdminUser.findOne({email: 'system@classplusapp.com'});
		if (!systemAdmin) {
			systemAdmin = new AdminUser({
				name: {first: 'System', last: 'Internal'},
				email: 'system@classplusapp.com',
				password: 'na',
				isAdmin: false
			});
			await systemAdmin.save();
			systemAdmin = await AdminUser.findOne({email: 'system@classplusapp.com'});
		}
		const group = 'cus-xxxxx-d-hhhh'.replace(/./g, digit => digit === 'x' ? ~~(Math.random() * 10) : digit === 'h' ? (~~(Math.random() * 16)).toString(16) : digit === 'd' ? +new Date() : digit);
		const oldObj = await Config.findOne({_id: object._id});
		const updatedAt = object[dirtyFields.find(field => field === 'updatedAt')] || new Date();
		const updatedBy = object[dirtyFields.find(field => field === 'updatedBy')] || object[dirtyFields.find(field => field === 'createdBy')] || oldObj.updatedBy || systemAdmin._id;
		for (let idx = 0; idx < dirtyFields.length; idx++) {
			let field = dirtyFields[idx];
			if (field.search(/createdAt|updatedAt|createdBy|updatedBy/i) === -1) {
				let history = new ConfigChangeHistory({
					config: object._id,
					changedField: field,
					oldVal: JSON.stringify({val: oldObj[field]}),
					newVal: JSON.stringify({val: object[field]}),
					group: group,
					createdAt: updatedAt,
					updatedAt: updatedAt,
					createdBy: updatedBy,
					updatedBy: updatedBy
				});
				await history.save();
			}
		}
	}

};
