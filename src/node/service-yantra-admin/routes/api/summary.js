const keystone = require('../../ks');
const Terminal = keystone.list('Terminal').model;
const Retailer = keystone.list('Retailer').model;
const TerminalLog = keystone.list('TerminalLog').model;
const GamePurchase = keystone.list('GamePurchase').model;
const GamePlay = keystone.list('GamePlay').model;
const Game = keystone.list('Game').model;
const moment = require('moment');

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
	console.log(mac, tid, rid, ec);
	try {
		let sod1 = new Date();
		sod1.setHours(0);
		sod1.setMinutes(0);
		sod1.setMilliseconds(0);
		sod1.setSeconds(0);
		let terminal;
		terminal = await Terminal.findOne({mac: mac, _id: tid}).lean();
		if (terminal) {
			terminal.r = await Retailer.findOne({_id: terminal.retailer, terminal: terminal._id});
		} else throw new Error('No terminal found!');
		if (rid.toString() !== terminal.r._id.toString()) throw new Error('Invalid terminal detected');
		let tl = await TerminalLog.findOne({payload: ec});
		if (!tl || tl.terminal.toString() !== tid.toString()) throw new Error('Invalid connection request');
		let gamePlayCache = {};
		let gameCache = {};

		const dayReport = async (sod) => {
			let eod = new Date(+sod);
			eod.setHours(23);
			eod.setMinutes(59);
			eod.setSeconds(0);
			eod.setMilliseconds(999);
			let purchases = await GamePurchase.find({
				$or: [{terminal: tid}, {redeemTerminal: tid}],
				createdAt: {$gte: sod.getTime(), $lte: eod.getTime()}
			});
			let c = 0, p = 0, wp = 0, rp = 0, bal = 0, cm = 0, cp = terminal.r.commission || 0, v = 0, rpo = 0,
				rpoBk = {}, can = 0;
			for (let idx = 0; idx < purchases.length; idx++) {
				let pur = purchases[idx];
				if (pur.terminal.toString() === tid) {
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
					if (pur.isCancelled) {
						can += pur.points;
					}
				}
				if (pur.redeemTerminal && pur.redeemTerminal.toString() === tid) {
					// todo find actual redeemed points
					let redeemedPoints = 0;
					rpo += redeemedPoints;
					rpoBk[pur.redeemTerminal.toString()] = rpoBk[pur.redeemTerminal.toString()] || 0;
					rpoBk[pur.redeemTerminal.toString()] = rpoBk[pur.redeemTerminal.toString()] + redeemedPoints;
				}
			}
			cm = (~~((((p - can) / 100) * cp) * 100)) / 100;
			bal = p - rp - cm - rpo;
			return {c, p, wp, rp, bal, cm, cp, rpo, rpoBk, can, dt: moment(sod).format('DD MMM YY')};
		};

		let d0 = await dayReport(new Date(+sod1));

		res.end(JSON.stringify({
			data: terminal, success: true, code: 200, feed: [
				d0,
				await dayReport(new Date(+sod1 - (1000 * 60 * 60 * 24))),
				await dayReport(new Date(+sod1 - (1000 * 60 * 60 * 24 * 2))),
				await dayReport(new Date(+sod1 - (1000 * 60 * 60 * 24 * 3))),
				await dayReport(new Date(+sod1 - (1000 * 60 * 60 * 24 * 4))),
				await dayReport(new Date(+sod1 - (1000 * 60 * 60 * 24 * 5))),
				await dayReport(new Date(+sod1 - (1000 * 60 * 60 * 24 * 6)))
			], plays: d0
		}));
		// res.end(JSON.stringify({
		// 	data: terminal, success: true, code: 200, plays: purchases.reduce((p, c) => {
		// 		if (c.terminal.toString() === tid) {
		// 			p.c += 1;
		// 			p.p += c.points;
		// 			p.v += c.val;
		// 			p.w += c.isRedeemed ? c.points : 0;
		// 		}
		// 		if (c.redeemTerminal && c.redeemTerminal.toString() === tid) p.r += c.points;
		// 		return p;
		// 	}, {p: 0, v: 0, r: 0, c: 0, w: 0})
		// }));

		// response
		// total tickets - c
		// total points - p
		// win points - wp
		// redeemed points - rp
		// balance bal
		// commission cm
	} catch (c) {
		console.log(c);
		res.end(JSON.stringify({error: c.message, success: false, code: 400}));
	}
};
