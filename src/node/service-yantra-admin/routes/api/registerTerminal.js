const keystone = require('../../ks');
const Terminal = keystone.list('Terminal').model;
const Retailer = keystone.list('Retailer').model;

exports = module.exports = async function (req, res) {
	console.log(req.headers['authorization']);
	if (req.headers['authorization'] !== 'yb:sljkjdlaskjdjlakjsdlk334lkjfalfj@alkfdj203rhqlefhljfwejkfhiufhiefhuwhflugfifghiwhgf') return res.end(JSON.stringify({
		error: 'Unauthorized',
		success: false,
		code: 401
	}));
	let mac = req.param('mac');
	try {
		let terminal;
		terminal = await Terminal.findOne({mac: mac}).lean();
		if (terminal) {
			terminal.r = await Retailer.findOne({_id: terminal.retailer, terminal: terminal._id}, {
				password: 0,
				username: 0
			}).lean();
		} else {
			terminal = new Terminal({
				mac: mac,
				enabled: true,
				debugMode: false
			});
			await terminal.save();
		}
		res.end(JSON.stringify({data: terminal, success: true, code: 200}));
	} catch (c) {
		console.log(c);
		res.end(JSON.stringify({error: c.message, success: false, code: 500}));
	}
};
