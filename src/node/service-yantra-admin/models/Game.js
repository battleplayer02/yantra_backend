const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * Game Model
 * ==========
 */
const Game = new keystone.List('Game', {track: true});

Game.add({
	name: {type: Types.Text, required: true, index: true, initial: true},
	description: {type: Types.Textarea, initial: true, required: false},
}, 'Settings', {
	totalTimeSecs: {type: Types.Number, initial: true, required: true, default: 300},
	freezeTimeSecs: {type: Types.Number, initial: true, required: true, default: 15},
	pointValue: {type: Types.Number, required: true, default: 2, initial: true},
	winPointsPerPoint: {type: Types.Number, required: true, default: 9, initial: true},
	payoutPercentage: {type: Types.Number, initial: true, required: true, default: 80},
	algorithm: {
		type: Types.Select,
		options: 'MAXIMIZE PAYOUT, MAXIMIZE SPREAD',
		default: 'MAXIMIZE PAYOUT',
		initial: true
	},
	spreadUpperDelta: {type: Types.Number, dependsOn: {algorithm: "MAXIMIZE SPREAD"}, default: 5, initial: true},
	spreadLowerDelta: {type: Types.Number, dependsOn: {algorithm: "MAXIMIZE SPREAD"}, default: 10, initial: true}
}, 'Visibility', {
	isPrivate: {type: Types.Boolean, initial: true, default: false, index: true},
	startTime: {
		hour: {
			type: Types.Select,
			options: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23',
			default: '8'
		},
		mins: {
			type: Types.Select,
			options: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59',
			default: '0'
		},
	},
	endTime: {
		hour: {
			type: Types.Select,
			options: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23',
			default: '18'
		},
		mins: {
			type: Types.Select,
			options: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59',
			default: '0'
		},
	}
});

/**
 * Registration
 */
Game.defaultColumns = 'name, description, isPrivate, payoutPercentage, algorithm, updatedAt, updatedBy';
Game.register();
