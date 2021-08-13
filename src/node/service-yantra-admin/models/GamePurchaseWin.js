const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * GamePurchaseWin Model
 * ==========
 */
const GamePurchaseWin = new keystone.List('GamePurchaseWin', {track: true, nodelete: true, noedit: true, nocreate: true});

GamePurchaseWin.add({
	num: {type: Types.Text, initial: true, required: false},
	points: {type: Types.Number, initial: true, required: false},
	peps: {type: Types.Number, initial: true, required: false},
}, 'Settings', {
	gamePlay: {type: Types.Relationship, ref: 'GamePlay', initial: true, index: true},
	game: {type: Types.Relationship, ref: 'Game', initial: true, index: true}
});

/**
 * Registration
 */
GamePurchaseWin.defaultColumns = 'num, points, peps, game, gamPlay, updatedAt, updatedBy';
GamePurchaseWin.register();
