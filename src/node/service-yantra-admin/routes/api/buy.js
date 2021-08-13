const keystone = require('../../ks');
const Terminal = keystone.list('Terminal').model;
const Retailer = keystone.list('Retailer').model;
const TerminalLog = keystone.list('TerminalLog').model;
const Game = keystone.list('Game').model;
const GamePurchase = keystone.list('GamePurchase').model;
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
	let p = parseInt(req.param('p'), 10);
	let v = parseInt(req.param('v'), 10);
	let gid = req.param('gid');
	let gpid = req.param('gpid');
	let bkd = req.param('bkd');
	let num = req.param('num');
	let code = req.param('code');
	console.log(mac, tid, rid, ec, p, v, gpid, gid);
	try {
		let terminal;
		terminal = await Terminal.findOne({mac: mac, _id: tid}).lean();
		if (terminal) {
			terminal.r = await Retailer.findOne({_id: terminal.retailer, terminal: terminal._id});
		} else throw new Error('No terminal found!');
		if (rid.toString() !== terminal.r._id.toString()) throw new Error('Invalid terminal detected');
		let tl = await TerminalLog.findOne({payload: ec});
		if (!tl || tl.terminal.toString() !== tid.toString()) throw new Error('Invalid connection request');
		terminal.r.credits = terminal.r.credits - p;
		if (terminal.r.credits < 0) throw new Error('Not enough credits');
		const purchase = new GamePurchase({
			code: code,
			num: num,
			bkd: bkd,
			points: p,
			val: v,
			terminal: tid,
			gamePlay: gpid,
			game: gid,
			isRedeemed: false,
			redeemedAt: null,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		await purchase.save();
		await terminal.r.save();
		res.end(JSON.stringify({data: terminal, success: true, code: 200, ref: purchase}));
	} catch (c) {
		console.log(c);
		res.end(JSON.stringify({error: c.message, success: false, code: 400}));
	}
};
