const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * GameLedgerEntry Model
 * ==========
 */
const GameLedgerEntry = new keystone.List('GameLedgerEntry', {track: true, nodelete: true, noedit: true, nocreate: true});

GameLedgerEntry.add({
	description: {type: Types.Text, required: true, noedit: true, initial:true},
	mode: {type: Types.Select, initial: true, required: true, options: 'DEBIT,CREDIT', noedit: true, default: 'CREDIT'},
	game: {type: Types.Relationship, ref: 'Game', noedit: true, index: true, initial:true},
	operator: {type: Types.Relationship, ref: 'Operator', noedit: true, index: true, initial:true},
	superStockist: {type: Types.Relationship, ref: 'SuperStockist', noedit: true, index: true, initial:true},
	stockist: {type: Types.Relationship, ref: 'Stockist', noedit: true, index: true, initial:true},
	retailer: {type: Types.Relationship, ref: 'Retailer', noedit: true, index: true, initial:true},
	amount: {type: Types.Number, noedit: true, index: true},
	balance: {type: Types.Number, noedit: true, index: true, nocreate: true},
});

/**
 * Registration
 */
GameLedgerEntry.defaultColumns = 'description, mode, game, operator, superStockist, stockist, retailer, createdBy, createdAt';
GameLedgerEntry.register();
