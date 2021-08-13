const keystone = require('../../ks');
const Terminal = keystone.list('Terminal').model;
const Retailer = keystone.list('Retailer').model;
const TerminalLog = keystone.list('TerminalLog').model;
const GamePlay = keystone.list('GamePlay').model;

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
	let gid = req.param('gid');
	console.log(mac, tid, rid, ec);
	try {
		let sod = new Date();
		sod.setHours(0);
		sod.setMinutes(0);
		sod.setMilliseconds(0);
		sod.setSeconds(0);
		let terminal;
		terminal = await Terminal.findOne({mac: mac, _id: tid}).lean();
		if (terminal) {
			terminal.r = await Retailer.findOne({_id: terminal.retailer, terminal: terminal._id});
		} else throw new Error('No terminal found!');
		if (rid.toString() !== terminal.r._id.toString()) throw new Error('Invalid terminal detected');
		let tl = await TerminalLog.findOne({payload: ec});
		if (!tl || tl.terminal.toString() !== tid.toString()) throw new Error('Invalid connection request');
		let plays = await GamePlay.find({
			isCompleted: true,
			game: gid,
			startTime: {$gte: sod.getTime()}
		}).sort({startTime: -1}).lean();
		res.end(JSON.stringify({data: terminal, success: true, code: 200, plays: plays}));
	} catch (c) {
		console.log(c);
		res.end(JSON.stringify({error: c.message, success: false, code: 400}));
	}
};
