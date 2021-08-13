const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * ConfigChangeHistory Model
 * ==========
 */
const ConfigChangeHistory = new keystone.List('ConfigChangeHistory', {
	track: true,
	drilldown: 'customer',
	noedit: true,
	nocreate: true,
	nodelete: true
});

ConfigChangeHistory.add({
	config: {type: Types.Relationship, required: true, initial: true, ref: 'Config'},
	changedField: {type: Types.Text, required: true, initial: true},
	oldVal: {type: Types.Text},
	newVal: {type: Types.Text},
	group: {type: Types.Text, required: true, initial: true}
});

/**
 * Registration
 */
ConfigChangeHistory.defaultColumns = 'createdAt, config, changedField, oldVal, newVal, group, updatedBy';

ConfigChangeHistory.register();
