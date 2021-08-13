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
	let cid = req.param('cid');
	console.log(mac, tid, rid, ec, cid);
	try {
		let terminal;
		terminal = await Terminal.findOne({mac: mac, _id: tid}).lean();
		if (terminal) {
			terminal.r = await Retailer.findOne({_id: terminal.retailer, terminal: terminal._id});
		} else throw new Error('No terminal found!');
		if (rid.toString() !== terminal.r._id.toString()) throw new Error('Invalid terminal detected');
		let tl = await TerminalLog.findOne({payload: ec});
		if (!tl || tl.terminal.toString() !== tid.toString()) throw new Error('Invalid connection request');

		const purchase = await GamePurchase.findOne({$or: [{code: cid}, {num: cid}]});
		if (!purchase) throw new Error('Invalid Purchase');
		if (purchase.isCancelled) throw new Error('Already cancelled this coupon.');

		const game = await Game.findOne({_id: purchase.game});
		const gamePlay = await GamePlay.findOne({_id: purchase.gamePlay});
		if (!game) throw new Error('No game in purchase.');
		if (!gamePlay) throw new Error('No game play in purchase.');
		if (gamePlay.isCompleted) throw new Error('This draw has ended. Can not cancel.');

		terminal.r.credits = terminal.r.credits + purchase.points;
		await terminal.r.save();
		purchase.isCancelled = true;
		await purchase.save();

		res.end(JSON.stringify({data: terminal, success: true, code: 200, purchase, tid}));
	} catch (c) {
		console.log(c);
		res.end(JSON.stringify({error: c.message, success: false, code: 400}));
	}
};
