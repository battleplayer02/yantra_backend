const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * Terminal Model
 * ==========
 */
const Terminal = new keystone.List('Terminal', {track: true, nodelete: false, map: {name: 'mac'}});

Terminal.add({
	mac: {type: Types.Text, required: true, initial: true},
	enabled: {type: Types.Boolean, initial: true, default: true, index: true},
	debugMode: {type: Types.Boolean, initial: true, default: false, index: true}
}, "Linked To", {
	retailer: {
		type: Types.Relationship,
		ref: "Retailer",
		index: true,
		initial: false,
		noedit: true,
		nocreate: true
	}
});

/**
 * Registration
 */
Terminal.defaultColumns = 'mac, retailer, enabled, updatedAt, updatedBy';
Terminal.register();
