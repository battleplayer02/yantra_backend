const keystone = require('../ks');
const Game = keystone.list('Game').model;
const Retailer = keystone.list('Retailer').model;
const RetailerDayWiseReport = keystone.list('RetailerDayWiseReport').model;
const GamePurchase = keystone.list('GamePurchase').model;
const GamePlay = keystone.list('GamePlay').model;


// job
module.exports = class RetailerReportJob {

	static get trigger() {
		return "1 minute";
	}

	static async task(_, done) {
		console.log('Running Job', this.name);
		const retailers = await Retailer.find();
		const bounds = this.getTodayDateBoundsIST(0);
		for (let idx = 0; idx < retailers.length; idx++) {
			await this.process(retailers[idx], bounds);
		}
		// const boundsM1 = this.getTodayDateBoundsIST(-1000 * 60 * 60 * 24);
		// for (let idx = 0; idx < retailers.length; idx++) {
		// 	await this.process(retailers[idx], boundsM1);
		// }
		// const boundsM2 = this.getTodayDateBoundsIST(-1000 * 60 * 60 * 24 * 2);
		// for (let idx = 0; idx < retailers.length; idx++) {
		// 	await this.process(retailers[idx], boundsM2);
		// }
		done();
	}

	static getTodayDateBoundsIST(principleDiff) {
		const tzDate = new Date();
		const invdate = new Date(tzDate.toLocaleString('en-US', {
			timeZone: 'Asia/Kolkata'
		}));
		let diff = tzDate.getTime() - invdate.getTime();
		const date = new Date(new Date().getTime() + principleDiff);
		date.setMilliseconds(0);
		date.setSeconds(30); // day shift offset
		date.setMinutes(0);
		date.setHours(0);
		const today = new Date(date.getTime() - diff + (1000 * 60 * 60 * 12));
		const bounds = {
			start: new Date(date.getTime() - diff),
			end: null,
			diff,
			today,
			principleDiff
		};
		date.setMilliseconds(999);
		date.setSeconds(59);
		date.setMinutes(59);
		date.setHours(23);
		bounds.end = new Date(date.getTime() - diff);
		return bounds;
	}

	static async process(retailer, bounds) {
		if (!retailer.terminal) {
			console.log('Retailer has no terminal, ignoring', retailer.name);
			return;
		}
		// see if record exists, else create one
		let report = await RetailerDayWiseReport.findOne({
			retailer: retailer._id,
			day: bounds.today.getDate(),
			month: bounds.today.getMonth() + 1,
			year: bounds.today.getFullYear()
		});
		if (!report) {
			report = new RetailerDayWiseReport({
				day: bounds.today.getDate(),
				month: bounds.today.getMonth() + 1,
				year: bounds.today.getFullYear(),
				date: bounds.today,
				role: 'Retailer',
				operator: retailer.operator,
				superStockist: retailer.superStockist,
				stockist: retailer.stockist,
				retailer: retailer._id,
				terminal: retailer.terminal,
				mPts: 0,
				fPts: 0,
				gp: 0,
				bal: 0,
				cancel: 0,
				totalPtsColl: 0
			});
		}
		// calculate stats
		let purchases = await GamePurchase.find({
			$or: [{terminal: retailer.terminal}, {redeemTerminal: retailer.terminal}],
			createdAt: {$gte: bounds.start, $lte: bounds.end}
		});
		let c = 0, p = 0, wp = 0, rp = 0, bal = 0, cm = 0, cp = (retailer.commission || 0), v = 0, rpo = 0, rpoBk = {},
			can = 0;
		let gamePlayCache = {};
		let gameCache = {};
		for (let idx = 0; idx < purchases.length; idx++) {
			let pur = purchases[idx];
			if (pur.terminal.toString() === retailer.terminal.toString()) {
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
			if (pur.redeemTerminal && pur.redeemTerminal.toString() === retailer.terminal.toString()) {
				// todo find actual redeemed points
				let redeemedPoints = 0;
				rpo += redeemedPoints;
				rpoBk[pur.redeemTerminal.toString()] = rpoBk[pur.redeemTerminal.toString()] || 0;
				rpoBk[pur.redeemTerminal.toString()] = rpoBk[pur.redeemTerminal.toString()] + redeemedPoints;
			}
		}
		cm = (~~((((p - can) / 100) * cp) * 100)) / 100;
		bal = p - rp - cm - rpo;
		report.mPts = p;
		report.fPts = rp;
		report.gp = cm;
		report.bal = bal;
		report.cancel = can;
		report.totalPtsColl = bal - can;
		await report.save();
	}
};
