const keystone = require('../ks');
const Game = keystone.list('Game').model;
const GamePurchaseWin = keystone.list('GamePurchaseWin').model;
const GamePurchase = keystone.list('GamePurchase').model;
const GamePlay = keystone.list('GamePlay').model;

// job
module.exports = class ServerStatsJob {

	static get trigger() {
		return "1 seconds";
	}

	static async task(_, done) {
		console.log('Running Job', this.name);

		const games = await Game.find();
		games.forEach(async g => await this.process(g));

		done();
	}

	static async process(game) {
		let play = await GamePlay.findOne({game: game._id, isCompleted: false});
		const codeGenerator = async () => {
			const date = new Date();
			const zeroPad = (num, len) => {
				if (num.toString().length < len) return `${'0'.repeat(len - num.toString().length)}${num}`;
				else return num.toString();
			};
			date.setMilliseconds(0);
			date.setHours(0);
			date.setMinutes(0);
			return `${zeroPad(date.getDate(), 2)}${zeroPad(date.getMonth(), 2)}${zeroPad(await GamePlay.count({startTime: {$gt: +date}}) + 1, 4)}`;
		};
		let sth = parseInt(game.startTime && game.startTime.hour || 7, 10);
		let stm = parseInt(game.startTime && game.startTime.mins || 7, 10);
		let etm = parseInt(game.endTime && game.endTime.mins || 15, 10);
		let eth = parseInt(game.endTime && game.endTime.hour || 15, 10);
		let ch = new Date().getHours();
		let cm = new Date().getMinutes();
		let msds = ch * 60 + cm + (5 * 60 + 30);
		let stds = sth * 60 + stm;
		let etds = eth * 60 + etm;
		console.log(`GAME PLAY SYNC TIMINGS: curr: ${ch}:${cm}-${msds} | st: ${sth}:${stm}-${stds} | et: ${eth}:${etm}-${etds}`);
		if (!play && (msds < stds || msds > etds)) {
			return 'game not running in this slot';
		}
		if (!play) {
			play = new GamePlay({
				info: 'play',
				code: await codeGenerator(),
				game: game._id,
				startTime: +new Date(),
				endTime: +new Date() + (game.totalTimeSecs * 1000),
				totalBet: 0,
				totalPayout: 0,
				strategy: [],
				isCompleted: false,
				winner: 0,
				createdAt: new Date(),
				updatedAt: new Date()
			});
			await play.save();
		}
		if (+new Date() < (play.endTime - (game.freezeTimeSecs * 1000))) {
			// play mode
			let payload = {
				play: play.toObject ? play.toObject() : play,
				canBuy: true,
				frozen: false,
				spinner: false,
				result: false,
				countdown: new Date(play.endTime - +new Date()).toISOString().substr(11, 8)
			};
			await this.sendToSocket(payload, game._id.toString());
		} else if (+new Date() < play.endTime) {
			//result mode
			if (!play.winner || play.winner === '0' || !play.winner.length) {
				play.winner = await this.calculateWinner(game, play);
				await play.save();
			}
			let payload = {
				play: play.toObject ? play.toObject() : play,
				canBuy: false,
				frozen: true,
				spinner: false,
				result: false,
				countdown: new Date(play.endTime - +new Date()).toISOString().substr(11, 8)
			};
			await this.sendToSocket(payload, game._id.toString());
		} else if (+new Date() < (play.endTime + 4000)) {
			// spin mode
			let payload = {
				play: play.toObject ? play.toObject() : play,
				canBuy: false,
				frozen: true,
				spinner: true,
				result: false,
				countdown: 'Waiting'
			};
			await this.sendToSocket(payload, game._id.toString());
		} else if (+new Date() < (play.endTime + 10000)) {
			// result display
			let payload = {
				play: play.toObject ? play.toObject() : play,
				canBuy: false,
				frozen: true,
				spinner: false,
				result: true,
				countdown: 'Waiting'
			};
			await this.sendToSocket(payload, game._id.toString());
		} else if (+new Date() < (play.endTime + 12000)) {
			play.isCompleted = true;
			await play.save();
		} else {
			play.isCompleted = true;
			await play.save();
		}
	}

	static async calculateWinner(game, play) {
		console.log('Calculating winner')
		let purchases = await GamePurchase.find({gamePlay: play._id});
		let mat = {total: 0};
		let peps = {total: 0};
		if (!purchases.length) {
			return (~~(Math.random() * 99)).toString();
		}
		let biddedNums = {};
		const getUnbiddedNum = () => {
			let nums = [];
			for(let x = 0; x < 100; x++){
				if(biddedNums[x] || biddedNums['' + x]){
					console.log('Ignore bidded num', x);
				} else {
					nums.push(x);
				}
			}
			if(nums.length){
				let w = nums[~~(Math.random() * nums.length)];
				console.log('UNBIDED NUM', w);
				return w;
			} else {
				let wb = (~~(Math.random() * 99));
				console.log('No unbidded hence sending random bidded', wb);
				return wb;
			}
		};
		purchases.forEach(pur => {
			try {
				let bkd = JSON.parse(pur.bkd);
				Object.keys(bkd).forEach(key => {
					biddedNums[key] = true;
					mat[key] = mat[key] || 0;
					mat[key] = mat[key] + parseInt(bkd[key], 10);
					mat.total = mat.total + parseInt(bkd[key], 10);
					// people
					peps[key] = peps[key] || 0;
					peps[key] = peps[key] + 1;
					peps.total = peps.total + 1;
				});
			} catch (c) {
				console.log(c);
			}
		});
		Object.keys(mat).forEach(async key => {
			await new GamePurchaseWin({
				num: key,
				points: mat[key],
				peps: peps[key],
				gamePlay: play._id,
				game: game._id
			}).save();
		});

		if (game.algorithm === 'MAXIMIZE PAYOUT') {
			let allowedPayout = mat.total * (game.payoutPercentage / 100);
			let possibilities = [];
			Object.keys(mat).forEach(key => {
				if ((mat[key] * game.winPointsPerPoint) <= allowedPayout) possibilities.push({
					num: key,
					points: mat[key] * game.winPointsPerPoint
				});
			});
			possibilities.sort((a, b) => b.points - a.points);
			return ((possibilities.shift() || {}).num || getUnbiddedNum()).toString();
		} else if (game.algorithm === 'MAXIMIZE SPREAD') {
			let allowedPayoutU = mat.total * ((game.payoutPercentage + game.spreadUpperDelta) / 100);
			let allowedPayoutL = mat.total * ((game.payoutPercentage - game.spreadLowerDelta) / 100);
			let possibilities = [];
			Object.keys(mat).forEach(key => {
				if (key !== 'total' && mat[key] * game.winPointsPerPoint >= allowedPayoutL && mat[key] * game.winPointsPerPoint <= allowedPayoutU) possibilities.push({
					num: key,
					points: mat[key] * game.winPointsPerPoint,
					peps: peps[key] || 0
				});
			});
			possibilities.sort((a, b) => b.peps - a.peps);
			return ((possibilities.shift() || {}).num || getUnbiddedNum()).toString();
		}
		// return (~~(Math.random() * 99) + 1).toString();
	}

	static async sendToSocket(message, gameId) {
		console.log('Sending to socket for Game ID', gameId);
		__io.sockets.emit(gameId, message);
	}
};
