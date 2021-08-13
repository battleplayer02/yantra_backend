const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * GamePurchase Model
 * ==========
 */
const GamePurchase = new keystone.List('GamePurchase', {track: true, nodelete: true, noedit: true, nocreate: true});

GamePurchase.add({
	code: {type: Types.Text, initial: true, required: false},
	num: {type: Types.Text, initial: true, required: false},
	bkd: {type: Types.Text, initial: true, required: false},
	points: {type: Types.Number, initial: true, required: false},
	val: {type: Types.Number, initial: true, required: false},
}, 'Settings', {
	terminal: {type: Types.Relationship, ref: 'Terminal', initial: true, index: true},
	redeemTerminal: {type: Types.Relationship, ref: 'Terminal', initial: true, index: true},
	gamePlay: {type: Types.Relationship, ref: 'GamePlay', initial: true, index: true},
	game: {type: Types.Relationship, ref: 'Game', initial: true, index: true},
	isRedeemed: {type: Types.Boolean, initial: false, default: false},
	isCancelled: {type: Types.Boolean, initial: false, default: false},
	redeemedAt: {type: Types.Date, initial: false},
});

/**
 * Registration
 */
GamePurchase.defaultColumns = 'code, num, points, val, game, terminal, updatedAt, updatedBy';
GamePurchase.register();
