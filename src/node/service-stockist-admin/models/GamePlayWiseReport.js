const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * GamePlayWiseReport Model
 * ==========
 */
const GamePlayWiseReport = new keystone.List('GamePlayWiseReport', {
	track: true,
	nocreate: true,
	nodelete: true,
	noedit: true,
	defaultSort: '-date',
	map: {name: 'code'}
});

GamePlayWiseReport.add({
	date: {type: Types.Date, required: true, index: true, noedit: true, initial: true},
	day: {type: Types.Number},
	month: {type: Types.Number},
	year: {type: Types.Number}
}, 'Cohort Info', {
	game: {
		type: Types.Relationship,
		ref: "Game",
		index: true
	},
	gamePlay: {
		type: Types.Relationship,
		ref: "GamePlay",
		index: true
	},
	code: {type: Types.Text}
}, 'Stats', {
	breakdown: {type: Types.Textarea},
	payoutPercentage: {type: Types.Number},
	winner: {type: Types.Text},
	tickets: {type: Types.Number},
	numTerminals: {type: Types.Number},
	mPts: {type: Types.Number, label: 'M.Pts'},
	fPts: {type: Types.Number, label: 'F.Pts'},
	cancel: {type: Types.Number}
});

/**
 * Registration
 */
GamePlayWiseReport.defaultColumns = 'date,code,gamePlay,tickets,mPts,fPts,cancel,game,numTerminals,winner';
GamePlayWiseReport.register();
