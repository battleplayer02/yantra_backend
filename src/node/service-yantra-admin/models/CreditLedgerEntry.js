const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * CreditLedgerEntry Model
 * ==========
 */
const CreditLedgerEntry = new keystone.List('CreditLedgerEntry', {track: true, nodelete: true, noedit: true});

CreditLedgerEntry.add({
	description: {type: Types.Text, required: true, noedit: true, initial: true},
	mode: {type: Types.Select, initial: true, required: true, options: 'DEBIT,CREDIT', noedit: true, default: 'CREDIT'},
	operator: {type: Types.Relationship, ref: 'Operator', noedit: true, index: true, initial: true},
	superStockist: {type: Types.Relationship, ref: 'SuperStockist', noedit: true, index: true, initial: true},
	stockist: {type: Types.Relationship, ref: 'Stockist', noedit: true, index: true, initial: true},
	retailer: {type: Types.Relationship, ref: 'Retailer', noedit: true, index: true, initial: true},
	amount: {type: Types.Number, noedit: true, index: true, initial: true},
	balance: {type: Types.Number, noedit: true, index: true, nocreate: true},
});

/**
 * Registration
 */
CreditLedgerEntry.defaultColumns = 'description, mode, operator, superStockist, stockist, retailer, amount, balance, createdBy, createdAt';
CreditLedgerEntry.register();

CreditLedgerEntry.model.schema.post('save', async function () {
	console.log("Post Processing the Ledger Entry");
	let query = {_id: {$ne: this._id}};
	if (this.retailer) query.retailer = this.retailer;
	if (this.stockist) query.stockist = this.stockist;
	if (this.superStockist) query.superStockist = this.superStockist;
	if (this.operator) query.operator = this.operator;
	let lastEntry = await CreditLedgerEntry.model.find(query).sort({createdAt: -1}).limit(1);
	lastEntry = lastEntry.shift();
	console.log("Last entry query:", query, lastEntry);
	if (lastEntry) {
		// delta
		if (this.mode === 'CREDIT') this.balance = (lastEntry.balance || 0) + this.amount;
		else if (this.mode === 'DEBIT') this.balance = (lastEntry.balance || 0) - this.amount;
		else {
			this.mode = "INVALID"
		}
	} else {
		// fresh
		this.balance = this.amount;
	}
	// save
	await CreditLedgerEntry.model.update({_id: this._id}, {$set: {balance: this.balance, mode: this.mode}});
	// sync in masters
	let Retailer = keystone.list('Retailer').model;
	let Stockist = keystone.list('Stockist').model;
	let SuperStockist = keystone.list('SuperStockist').model;
	let Operator = keystone.list('Operator').model;
	if (this.retailer) {
		await Retailer.update({_id: this.retailer}, {$set: {credits: this.balance}});
	}
	else if (this.stockist) {
		await Stockist.update({_id: this.stockist}, {$set: {credits: this.balance}});
	}
	else if (this.superStockist) {
		await SuperStockist.update({_id: this.superStockist}, {$set: {credits: this.balance}});
	}
	else if (this.operator) {
		await Operator.update({_id: this.operator}, {$set: {credits: this.balance}});
	}
});

// todo self creation fillups in pre save. based on role know what to fill and what not
