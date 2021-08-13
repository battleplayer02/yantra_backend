const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * Retailer Model
 * ==========
 */
const Retailer = new keystone.List('Retailer', {track: true});

Retailer.add({
	name: {type: Types.Text, required: true, index: true},
	username: {type: Types.Text, initial: true, required: true},
	password: {type: Types.Password, initial: true, required: true},
	operator: {type: Types.Relationship, ref: "Operator", initial: true, required: true},
	superStockist: {type: Types.Relationship, ref: "SuperStockist", initial: true, required: true, filters: { operator: ':operator' }},
	stockist: {type: Types.Relationship, ref: "Stockist", initial: true, required: true, filters: { superStockist: ':superStockist' }},
	initialCredits: {type: Types.Number, initial: true, noedit: true},
	commission: {type: Types.Number, initial: true, noedit: false, default: 5},
	isActive: {type: Types.Boolean, initial: true, default: true, index: true}
}, 'Hardware', {
	terminal: {
		type: Types.Relationship,
		ref: "Terminal",
		index: true,
		initial: true
	}
}, 'Summary', {
	game: {type: Types.Relationship, ref: "Game", initial: true, required: true},
	credits: {type: Types.Number, noedit: true, default: 0}
});


/**
 * Registration
 */
Retailer.defaultColumns = 'name, isActive, game, credits, operator, superStockist, stockist, terminal, updatedAt, updatedBy';
Retailer.register();

const ThisModel = Retailer;
ThisModel.model.schema.pre('save', async function (next) {
	try {
		const CreditLedgerEntry = keystone.list('CreditLedgerEntry').model;
		const Terminal = keystone.list('Terminal').model;
		///////////// CREDITS HANDLING ///////////////////////////
		if (this.isNew) {
			const entry = new CreditLedgerEntry({
				description: "Initial Credit Applied.",
				mode: 'CREDIT',
				operator: this.operator,
				superStockist: this.superStockist,
				stockist: this.stockist,
				retailer: this._id,
				amount: this.initialCredits,
				balance: undefined,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: this.createdBy,
				updatedBy: this.updatedBy
			});
			await entry.save();
		}
		///////////// END CREDITS HANDLING ///////////////////////////
		///////////// Save in terminal //////////////////////////////
		if(this.terminal){
			await Terminal.update({_id: this.terminal}, {$set: {retailer: this._id}});
		}
		///////////// End Save in terminal //////////////////////////
		next();
	} catch (c) {
		next(c);
	}
});
