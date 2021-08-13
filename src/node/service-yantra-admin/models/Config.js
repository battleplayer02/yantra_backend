const keystone = require('../ks');
const Types = keystone.Field.Types;
const ConfigHistoryService = require('../services/ConfigHistoryService');

/**
 * Config Model
 * ==========
 */
const Config = new keystone.List('Config', {track: true, nodelete: true});

Config.add({
	name: {type: Types.Text, index: true, initial: true},
	type: {
		type: Types.Select,
		options: ['NUMBER', 'DATETIME', 'BOOLEAN', 'TEXT', 'LARGE TEXT'],
		index: true,
		initial: true,
		noedit: true
	},
	environment: {
		type: Types.Select,
		options: ['development', 'staging', 'qa', 'test', 'production', 'preprod', 'all'],
		index: true,
		initial: true,
		required: true
	},
	value: {
		type: Types.Text, index: true, hidden: true, noedit: true
	},
	valueNumber: {
		type: Types.Number, dependsOn: {type: 'NUMBER'}, label: 'Value',
		initial: true
	},
	valueDatetime: {
		type: Types.Datetime, dependsOn: {type: 'DATETIME'}, label: 'Value',
		initial: true
	},
	valueBoolean: {
		type: Types.Boolean, dependsOn: {type: 'BOOLEAN'}, label: 'Value',
		initial: true
	},
	valueText: {
		type: Types.Text, dependsOn: {type: 'TEXT'}, label: 'Value',
		initial: true
	},
	valueLargeText: {
		type: Types.Textarea, dependsOn: {type: 'LARGE TEXT'}, label: 'Value',
		initial: true
	},
	isPublic: {
		type: Types.Boolean,
		default: true
	}
});

/**
 * Registration
 */
Config.defaultColumns = 'name, type, value, environment, isPublic, updatedAt, updatedBy';
Config.register();

Config.model.schema.pre('save', async function (next) {
	if (this.type === 'NUMBER') {
		this.value = this.valueNumber;
		this.valueLargeText = null;
		this.valueBoolean = null;
		this.valueDatetime = null;
		this.valueText = null;
	}
	if (this.type === 'BOOLEAN') {
		this.value = this.valueBoolean;
		this.valueLargeText = null;
		this.valueNumber = null;
		this.valueDatetime = null;
		this.valueText = null;
	}
	if (this.type === 'DATETIME') {
		this.value = this.valueDatetime;
		this.valueLargeText = null;
		this.valueNumber = null;
		this.valueBoolean = null;
		this.valueText = null;
	}
	if (this.type === 'TEXT') {
		this.value = this.valueText;
		this.valueLargeText = null;
		this.valueNumber = null;
		this.valueBoolean = null;
		this.valueDatetime = null;
	}
	if (this.type === 'LARGE TEXT') {
		this.value = this.valueLargeText;
		this.valueText = null;
		this.valueNumber = null;
		this.valueBoolean = null;
		this.valueDatetime = null;
	}
	await ConfigHistoryService.registerConfigUpdate(this.isNew, this);
	next();
});
