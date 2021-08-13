const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * ReportedError Model
 * ==========
 */
const ReportedError = new keystone.List('ReportedError', {track: true, nodelete: true, nocreate: true, noedit:true});

ReportedError.add({
	source: {type: Types.Text, required: true, index: true},
	// agent: {type: Types.Relationship, ref: 'Agent', initial: true, required: false},
	description: {type: Types.Textarea, initial: true, required: false, noedit: true},
	isComplete: { type: Types.Boolean, index: true }
});

/**
 * Registration
 */
ReportedError.defaultColumns = 'createdAt, source, agent, description, updatedAt';
ReportedError.register();
