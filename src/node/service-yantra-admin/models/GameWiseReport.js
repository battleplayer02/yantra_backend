const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * GameWiseReport Model
 * ==========
 */
const GameWiseReport = new keystone.List('GameWiseReport', {
	track: true,
	nocreate: true,
	nodelete: true,
	noedit: true,
	defaultSort: '-date',
	map: {name: 'date'}
});

GameWiseReport.add({
	date: {type: Types.Date, required: true, index: true, noedit: true, initial: true},
	game: {type: Types.Relationship, ref: "Game", index: true},
}, 'Cohort Info', {
	role: {type: Types.Select, options: 'Company, Operator, Super Stockist, Stockist, Retailer', initial: true, required: true},
	operator: {type: Types.Relationship, ref: "Operator", dependsOn: {role: "Operator"}, index: true, initial: true},
	superStockist: {type: Types.Relationship, ref: "SuperStockist", dependsOn: {role: "Super Stockist"}, index: true, initial: true},
	stockist: {type: Types.Relationship, ref: "Stockist", dependsOn: {role: "Stockist"}, index: true, initial: true},
	retailer: {type: Types.Relationship, ref: "Retailer", dependsOn: {role: "Retailer"}, index: true, initial: true},
}, 'Stats', {
	totalBet: {type: Types.Number},
	totalPayout: {type: Types.Number},
	totalProfit: {type: Types.Number},
	totalCommission: {type: Types.Number},
	totalGamePlays: {type: Types.Number}
});

/**
 * Registration
 */
GameWiseReport.defaultColumns = 'date,game,totalBet,totalPayout,totalProfit,totalGamePlays';
GameWiseReport.register();
