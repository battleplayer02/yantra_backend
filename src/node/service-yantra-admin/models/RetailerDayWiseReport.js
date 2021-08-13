const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * RetailerDayWiseReport Model
 * ==========
 */
const RetailerDayWiseReport = new keystone.List('RetailerDayWiseReport', {
	track: true,
	nocreate: true,
	nodelete: true,
	noedit: true,
	defaultSort: '-date',
	map: {name: 'retailer'}
});

RetailerDayWiseReport.add({
	date: {type: Types.Date, required: true, index: true, noedit: true, initial: true},
	day: {type: Types.Number},
	month: {type: Types.Number},
	year: {type: Types.Number}
}, 'Cohort Info', {
	role: {type: Types.Select, options: 'Company, Operator, Super Stockist, Stockist, Retailer', initial: true, required: true},
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
RetailerDayWiseReport.defaultColumns = 'date,role,retailer,mPts,fPts,gp,bal,cancel,totalPtsColl';
RetailerDayWiseReport.register();
