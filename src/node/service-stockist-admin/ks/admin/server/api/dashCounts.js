exports = module.exports = async function (req, res) {
	const keystone = req.keystone;
	const Terminal = keystone.list('Terminal').model;
	const Retailer = keystone.list('Retailer').model;
	const TerminalLog = keystone.list('TerminalLog').model;
	const GamePurchase = keystone.list('GamePurchase').model;
	const GamePlay = keystone.list('GamePlay').model;
	const Game = keystone.list('Game').model;
	const moment = require('moment');
	let user = req.user._doc || req.user;
	// console.log(req.headers['authorization']);
	// if (req.headers['authorization'] !== 'yb:sljkjdlaskjdjlakjsdlk334lkjfalfj@alkfdj203rhqlefhljfwejkfhiufhiefhuwhflugfifghiwhgf') return res.end(JSON.stringify({
	// 	error: 'Unauthorized',
	// 	success: false,
	// 	code: 401
	// }));
	try {
		let sod1 = new Date();
		sod1.setHours(0);
		sod1.setMinutes(0);
		sod1.setMilliseconds(0);
		sod1.setSeconds(0);

		let gamePlayCache = {};
		let gameCache = {};

		// find all retailers of stockist
		// find all terminals of stockist
		let rets = await Retailer.find({stockist: user.stockist});
		console.log(rets);
		let tids = rets.map(r => r.terminal).filter(t => !!t);
		console.log(tids);
		const dayReport = async (sod) => {
			let eod = new Date(+sod);
			eod.setHours(23);
			eod.setMinutes(59);
			eod.setSeconds(0);
			eod.setMilliseconds(999);
			let purchases = await GamePurchase.find({
				terminal: {$in: tids},
				createdAt: {$gte: sod.getTime(), $lte: eod.getTime()}
			});
			let c = 0, p = 0, wp = 0, rp = 0, bal = 0, cm = 0, v = 0, rpo = 0,
				rpoBk = {}, can = 0;
			for (let idx = 0; idx < purchases.length; idx++) {
				let pur = purchases[idx];
				c++;
				p += pur.points;
				v += pur.val;
				pur.bkdo = JSON.parse(pur.bkd || {});
				if (!gamePlayCache[pur.gamePlay.toString()]) {
					gamePlayCache[pur.gamePlay.toString()] = await GamePlay.findOne({_id: pur.gamePlay});
				}
				if (!gameCache[pur.game.toString()]) {
					gameCache[pur.game.toString()] = await Game.findOne({_id: pur.game});
				}
				let winner = gamePlayCache[pur.gamePlay.toString()].winner;
				let winPoints = pur.bkdo[winner] || 0;
				winPoints = winPoints * gameCache[pur.game.toString()].winPointsPerPoint;
				if (!pur.isCancelled) {
					wp += winPoints;
				}
				if (!pur.isCancelled && pur.isRedeemed) {
					rp += winPoints;
				}
				let cap = 0;
				if (pur.isCancelled) {
					can += pur.points;
					cap = pur.points;
				}
				// calculate commission for each purchase
				let ret = rets.find(r => r.terminal && pur.terminal && r.terminal.toString() === pur.terminal.toString());
				let cpp = ret && ret.commission || 0;
				console.log({ret, cpp});
				cm = cm + (((pur.points - cap) / 100) * cpp);
			}
			cm = (~~(cm * 100)) / 100;
			bal = p - rp - cm - rpo;
			return {
				c, p, wp, rp, balance: bal, cm, rpo, rpoBk, can,
				dt: moment(sod).format('DD MMM YY'),
				mpts: p.toFixed(2),
				fpts: rp.toFixed(2),
				gp: cm.toFixed(2),
				bal: bal.toFixed(2),
				cancel: can.toFixed(2),
				ptsColl: (bal - can).toFixed(2),
				totalRetailers: rets.length,
				canPer: ((((can || 0) / (p || 0)) * 100) || 0).toFixed(2) + '%',
				payoutPer: ((((rp || 0) / ((p - can) || 0)) * 100) || 0).toFixed(2) + '%'
			};
		};

		let d0 = await dayReport(new Date(+sod1));

		res.end(JSON.stringify(d0));
	} catch (c) {
		console.log(c);
		res.end(JSON.stringify({error: c.message, success: false, code: 400}));
	}
};
