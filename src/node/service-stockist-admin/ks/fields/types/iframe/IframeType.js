var FieldType = require('../Type');
var util = require('util');
var utils = require('keystone-utils');


/**
 * IFrame FieldType Constructor
 * @extends Field
 * @api public
 */
function iframe(list, path, options) {
	this.options = options;
	this.width = options.width || 200;
	this.height = options.height || 200;
	this._properties = ['width ', 'height'];
	this._nativeType = String;
	this._properties = ['monospace'];
	iframe.super_.call(this, list, path, options);
}

iframe.properName = 'Iframe';
util.inherits(iframe, FieldType);

iframe.prototype.validateInput = function (data, callback) {
	var max = this.options.max;
	var min = this.options.min;
	var value = this.getValueFromData(data);
	var result = value === undefined || value === null || typeof value === 'string';
	if (max && typeof value === 'string') {
		result = value.length < max;
	}
	if (min && typeof value === 'string') {
		result = value.length > min;
	}
	utils.defer(callback, result);
};

iframe.prototype.validateRequiredInput = function (item, data, callback) {
	var value = this.getValueFromData(data);
	var result = !!value;
	if (value === undefined && item.get(this.path)) {
		result = true;
	}
	utils.defer(callback, result);
};

/**
 * Add filters to a query
 */
iframe.prototype.addFilterToQuery = function (filter) {
	var query = {};
	if (filter.mode === 'exactly' && !filter.value) {
		query[this.path] = filter.inverted ? { $nin: ['', null] } : { $in: ['', null] };
		return query;
	}
	var value = utils.escapeRegExp(filter.value);
	if (filter.mode === 'beginsWith') {
		value = '^' + value;
	} else if (filter.mode === 'endsWith') {
		value = value + '$';
	} else if (filter.mode === 'exactly') {
		value = '^' + value + '$';
	}
	value = new RegExp(value, filter.caseSensitive ? '' : 'i');
	query[this.path] = filter.inverted ? { $not: value } : value;
	return query;
};


/* Export Field Type */
module.exports = iframe;
