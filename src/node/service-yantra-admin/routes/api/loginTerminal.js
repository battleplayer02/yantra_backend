const keystone = require('../../ks');
const Terminal = keystone.list('Terminal').model;
const Retailer = keystone.list('Retailer').model;
const TerminalLog = keystone.list('TerminalLog').model;
const Game = keystone.list('Game').model;

exports = module.exports = async function (req, res) {
	console.log(req.headers['authorization']);
	if (req.headers['authorization'] !== 'yb:sljkjdlaskjdjlakjsdlk334lkjfalfj@alkfdj203rhqlefhljfwejkfhiufhiefhuwhflugfifghiwhgf') return res.end(JSON.stringify({
		error: 'Unauthorized',
		success: false,
		code: 401
	}));
	let mac = req.param('mac');
	let tid = req.param('tid');
	let rid = req.param('rid');
	let ec = req.param('ec');
	let username = req.param('u');
	let password = req.param('p');
	console.log(mac, tid, rid, ec);
	try {
		let terminal;
		terminal = await Terminal.findOne({mac: mac, _id: tid}).lean();
		if (terminal) {
			terminal.r = await Retailer.findOne({_id: terminal.retailer, terminal: terminal._id});
		} else throw new Error('No terminal found!');
		if (rid.toString() !== terminal.r._id.toString()) throw new Error('Invalid terminal detected');
		let tl = await TerminalLog.findOne({payload: ec});
		if (!tl || tl.terminal.toString() !== tid.toString()) throw new Error('Invalid connection request');
		//await TerminalLog.update({_id: tl._id}, {$set: {payload: ''}}); //
		// verify password
		if (terminal.r.username !== username) throw new Error('Invalid username.');
		let matches = await new Promise((res, rej) => {
			terminal.r._.password.compare(password, (err, result) => {
				if (err) rej(err);
				else res(result);
			});
		});
		if (!matches) throw new Error('Invalid password');
		terminal.r = terminal.r.toObject ? terminal.r.toObject() : terminal.r;
		delete terminal.r.password;
		// get game data
		terminal.g = await Game.findOne({_id: terminal.r.game}).lean();
		if (!terminal.g) throw new Error('No Game assigned to this terminal.');
		res.end(JSON.stringify({data: terminal, success: true, code: 200}));
	} catch (c) {
		console.log(c);
		res.end(JSON.stringify({error: c.message, success: false, code: 400}));
	}
};
