const keystone = require('../ks');
const Game = keystone.list('Game').model;
const Retailer = keystone.list('Retailer').model;
const GamePlayWiseReport = keystone.list('GamePlayWiseReport').model;
const GamePurchase = keystone.list('GamePurchase').model;
const GamePlay = keystone.list('GamePlay').model;


// job
module.exports = class GamePlayReportJob {

	static get trigger() {
		return "1 minute";
	}

	static async task(_, done) {
		console.log('Running Job', this.name);
		await this.reportTodaysPlays(this.getTodayDateBoundsIST(0));
		await this.reportTodaysPlays(this.getTodayDateBoundsIST(-1000 * 60 * 60 * 24));
		await this.reportTodaysPlays(this.getTodayDateBoundsIST(-1000 * 60 * 60 * 24 * 2));
		done();
	}

	static async reportTodaysPlays(bounds) {
		const plays = await GamePlay.find({createdAt: {$gte: bounds.start, $lte: bounds.end}});
		for (let idx = 0; idx < plays.length; idx++) {
			await this.process(plays[idx], bounds);
		}
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

	static async process(play, bounds) {
		// see if record exists, else create one
		let report = await GamePlayWiseReport.findOne({
			gamePlay: play._id
		});
		if (!report) {
			report = new GamePlayWiseReport({
				day: bounds.today.getDate(),
				month: bounds.today.getMonth() + 1,
				year: bounds.today.getFullYear(),
				date: bounds.today,
				game: play.game,
				gamePlay: play._id,
				code: play.code,
				breakdown: '',
				payoutPercentage: 0,
				winner: play.winner,
				tickets: 0,
				numTerminals: 0,
				mPts: 0,
				fPts: 0,
				cancel: 0
			});
		}
		// calculate stats
		let purchases = await GamePurchase.find({
			gamePlay: play._id
		});
		const terms = {};
		purchases.forEach(p => {
			if (p.terminal) {
				terms[p.terminal.toString()] = true;
			}
		});
		report.numTerminals = Object.keys(terms).length;
		let c = 0, p = 0, wp = 0, rp = 0, v = 0, can = 0;
		const bkdg = {};
		let gameCache = {};
		for (let idx = 0; idx < purchases.length; idx++) {
			let pur = purchases[idx];
			pur = pur.toObject && pur.toObject() || pur;
			c++;
			p += pur.points;
			v += pur.val;
			pur.bkdo = JSON.parse(pur.bkd || {});
			if (!gameCache[pur.game.toString()]) {
				gameCache[pur.game.toString()] = await Game.findOne({_id: pur.game});
			}
			let winner = play.winner || -1;
			let winPoints = pur.bkdo[winner] || 0;
			winPoints = winPoints * gameCache[pur.game.toString()].winPointsPerPoint;
			Object.keys(pur.bkdo).forEach(k => {
				bkdg[k] = bkdg[k] || 0;
				bkdg[k] = bkdg[k] + pur.bkdo[k];
			});
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
		report.tickets = c;
		report.mPts = p;
		report.fPts = rp;
		report.cancel = can;
		console.log({rp,p})
		report.payoutPercentage = ((rp / p) * 100) || 0;
		const segs = [];
		Object.keys(bkdg).forEach(k => {
			segs.push(`${k}: ${bkdg[k]}`);
		});
		report.breakdown = segs.join(' \n ');
		await report.save();
	}
};
