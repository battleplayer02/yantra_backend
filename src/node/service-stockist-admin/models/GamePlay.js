const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * GamePlay Model
 * ==========
 */
const GamePlay = new keystone.List('GamePlay', {track: true, nodelete: true, noedit: true, nocreate: true});

GamePlay.add({
	info: {type: Types.Text, initial: true, required: false},
	code: {type: Types.Text, initial: true, required: false},
}, 'Settings', {
	game: {type: Types.Relationship, ref: 'Game', initial: true, index: true},
	startTime: {type: Types.Number, initial: true, required: true, index: true},
	endTime: {type: Types.Number, initial: true},
	totalBet: {type: Types.Number, initial: true},
	totalPayout: {type: Types.Number, initial: true},
	strategy: {type: Types.TextArray, initial: false},
	isCompleted: {type: Types.Boolean, initial: false, default: false},
	winner: {type: Types.Text}
});

/**
 * Registration
 */
GamePlay.defaultColumns = 'info, game, isCompleted, totalBet, totalPayout, updatedAt, updatedBy';
GamePlay.register();
