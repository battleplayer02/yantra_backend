const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * TerminalDayWiseReport Model
 * ==========
 */
const TerminalDayWiseReport = new keystone.List('TerminalDayWiseReport', {
	track: true,
	nocreate: true,
	nodelete: true,
	noedit: true,
	defaultSort: '-date',
	map: {name: 'terminal'}
});

TerminalDayWiseReport.add({
	date: {type: Types.Date, required: true, index: true, noedit: true, initial: true},
	day: {type: Types.Number},
	month: {type: Types.Number},
	year: {type: Types.Number}
}, 'Cohort Info', {
	operator: {
		type: Types.Relationship,
		ref: "Operator",
		index: true,
		initial: true
	},
	superStockist: {
		type: Types.Relationship,
		ref: "SuperStockist",
		index: true,
		initial: true
	},
	stockist: {type: Types.Relationship, ref: "Stockist", index: true, initial: true},
	retailer: {type: Types.Relationship, ref: "Retailer", index: true, initial: true},
	terminal: {type: Types.Relationship, ref: "Terminal", index: true, initial: true},
}, 'Stats', {
	mPts: {type: Types.Number, label: 'M.Pts'},
	fPts: {type: Types.Number, label: 'F.Pts'},
	gp: {type: Types.Number, label: 'G.P'},
	bal: {type: Types.Number},
	cancel: {type: Types.Number},
	totalPtsColl: {type: Types.Number}
});

/**
 * Registration
 */
TerminalDayWiseReport.defaultColumns = 'date,terminal,mPts,fPts,gp,bal,cancel,totalPtsColl';
TerminalDayWiseReport.register();
