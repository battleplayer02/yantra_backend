const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * TerminalLog Model
 * ==========
 */
const TerminalLog = new keystone.List('TerminalLog', {
	track: true,
	nodelete: true,
	nocreate: true,
	noedit: true,
	map: {name: 'createdAt'}
});

TerminalLog.add({
	message: {type: Types.Text},
	payload: {type: Types.Text, index: true}
}, "Linked To", {
	terminal: {
		type: Types.Relationship,
		ref: "Terminal",
		index: true,
		initial: false
	}
});

/**
 * Registration
 */
TerminalLog.defaultColumns = 'createdAt, terminal, message, updatedAt, updatedBy';
TerminalLog.register();
