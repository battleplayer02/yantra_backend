const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * AdminUser Model
 * ==========
 */
const AdminUser = new keystone.List('AdminUser', {track: true, nodelete: true});

AdminUser.add({
	name: {type: Types.Name, required: true, index: true},
	email: {type: Types.Text, initial: true, required: true, unique: true, index: true},
	password: {type: Types.Password, initial: true, required: true},
}, 'Permissions', {
	role: {type: Types.Select, options: 'Company, Operator, Super Stockist, Stockist, Retailer', initial: true, required: true},
	operator: {type: Types.Relationship, ref: "Operator", dependsOn: {role: "Operator"}, index: true, initial: true},
	superStockist: {type: Types.Relationship, ref: "SuperStockist", dependsOn: {role: "Super Stockist"}, index: true, initial: true},
	stockist: {type: Types.Relationship, ref: "Stockist", dependsOn: {role: "Stockist"}, index: true, initial: true},
	retailer: {type: Types.Relationship, ref: "Retailer", dependsOn: {role: "Retailer"}, index: true, initial: true},
	isAdmin: {type: Boolean, label: 'Can Login To Admin?', initial: true, index: true, default: true},
});

// Provide access to Keystone
AdminUser.schema.virtual('canAccessKeystone').get(function () {
	return this.isAdmin;
});


/**
 * Registration
 */
AdminUser.defaultColumns = 'name, email, isAdmin, role, superStockist, stockist, updatedAt, updatedBy, createdAt, createdBy';
AdminUser.register();

// TODO pre save role based check to have desired mappings


