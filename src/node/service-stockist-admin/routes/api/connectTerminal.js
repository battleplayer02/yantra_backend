const keystone = require('../../ks');
const Terminal = keystone.list('Terminal').model;
const Retailer = keystone.list('Retailer').model;
const TerminalLog = keystone.list('TerminalLog').model;

exports = module.exports = async function (req, res) {
	console.log(req.headers['authorization']);
	if (req.headers['authorization'] !== 'yb:sljkjdlaskjdjlakjsdlk334lkjfalfj@alkfdj203rhqlefhljfwejkfhiufhiefhuwhflugfifghiwhgf') return res.end(JSON.stringify({
		error: 'Unauthorized',
		success: false,
		code: 401
	}));
	let mac = req.param('mac');
	let tid = req.param('tid');
	console.log(mac, tid);
	try {
		let terminal;
		terminal = await Terminal.findOne({mac: mac, _id: tid}).lean();
		if (terminal) {
			terminal.r = await Retailer.findOne({_id: terminal.retailer, terminal: terminal._id}, {
				password: 0,
				username: 0
			}).lean();
		} else throw new Error('No terminal found!');
		if (terminal.enabled && terminal.r) {
			terminal.ec = `${Math.random() * 100000}${Math.random() * 100000}:${+new Date()}:${tid}:${mac}${Math.random() * 100}`;
			let tl = new TerminalLog({
				message: 'Terminal Connected.',
				payload: terminal.ec,
				terminal: terminal._id
			});
			await tl.save();
		} else throw new Error('Terminal not enabled.');
		res.end(JSON.stringify({data: terminal, success: true, code: 200}));
	} catch (c) {
		console.log(c);
		res.end(JSON.stringify({error: c.message, success: false, code: 400}));
	}
};
