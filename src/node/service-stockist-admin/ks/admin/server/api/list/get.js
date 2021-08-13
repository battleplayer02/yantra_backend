var async = require('async');
var assign = require('object-assign');
var listToArray = require('list-to-array');

module.exports = function (req, res) {
	if (req.url.search(/\/followups/) > 0 && req.query && req.query.search) {
		console.log('Attempt find user by username..............................', req.query.search);
		const Customer = req.keystone.list('Customer').model;
		Customer.findOne({userName: req.query.search}, function (err, cust) {
			if (err) console.log(err);
			process(req, res, {customerUserName: cust && cust._id || null, isFollowup: true})
		});
	} else {
		process(req, res, {});
	}
};

function process(req, res, data) {
	console.log('Called with data...........................', data);
	var where = {};
	var fields = req.query.fields;
	var includeCount = req.query.count !== 'false';
	var includeResults = req.query.results !== 'false';
	if (includeResults && fields) {
		if (fields === 'false') {
			fields = false;
		}
		if (typeof fields === 'string') {
			fields = listToArray(fields);
		}
		if (fields && !Array.isArray(fields)) {
			return res.status(401).json({error: 'fields must be undefined, a string, or an array'});
		}
	}
	if (req.url.search(/\/customers/) > 0 && Array.isArray(fields)) {
		console.log('Enriching Search query: CUSTOMERS FIELDS..............................');
		fields.push('welcomePackStatus', 'trackingNumber', 'sharedWithPrinterOn', 'status');
	}
	var filters = req.query.filters;
	if (filters && typeof filters === 'string') {
		try {
			filters = JSON.parse(req.query.filters);
		} catch (e) {
		} // eslint-disable-line no-empty
	}
	filters = require('../../../../../permissions/Filter').listGet(filters, req.user._doc || req.user);
	if (typeof filters === 'object') {
		assign(where, req.list.addFiltersToQuery(filters));
	}
	if (req.query.search) {
		let fields = null;
		// if (req.url.search(/\/customers/) > 0) {
		// 	console.log('Enriching Search query: CUSTOMERS..............................');
		// 	fields = ['phoneNumbers', 'email', 'userName'];
		// }
		// if (data.isFollowup && data.customerUserName) {
		// 	console.log('Overriding for Customer username search.....');
		// 	fields = ['customer'];
		// 	req.query.search = data.customerUserName;
		// }
		assign(where, req.list.addSearchToQuery(req.query.search, fields));
	}
	if (req.url.search(/\/customers/) > 0) {
		// console.log('Enriching <><><> isDelete: CUSTOMERS..............................', filters);
		where.isDeleted = false;
		if (filters && filters.isDeleted) {
			where.isDeleted = filters.isDeleted.value;
			console.log('>>>>>>>>>>>>>>>>>>>>>> LIST isDELETED', where.isDeleted, req.url);
		}
	}

	if (req.url.search(/\/customers/) > 0 && req.query.search && req.query.search.trim().split(' ').length && req.query.search.trim().split(' ').length >= 2 && where && where.$or && where.$or[0] && where.$or[0].$or) {
		// fix in searching on name field
		// console.log('$or to $and', where.$or[0]);
		// where.$or[0].$and = where.$or[0].$or;
		// delete where.$or[0].$or;
	}

	if (typeof filters === 'object' && filters['followupDate'] && filters['followupDate'].valueNotExists) {
		where = {
			$or: [
				{markedAsDoneAt: {$exists: false}},
				{markedAsDoneAt: null}
			]
		}
	}

	var query = req.list.model.find(where);
	if (req.query.populate) {
		query.populate(req.query.populate);
	}
	if (req.query.expandRelationshipFields && req.query.expandRelationshipFields !== 'false') {
		req.list.relationshipFields.forEach(function (i) {
			query.populate(i.path);
		});
	}
	var sort = req.list.expandSort(req.query.sort);
	async.waterfall([
		function (next) {
			if (!includeCount) {
				return next(null, 0);
			}
			query.count(next);
		},
		function (count, next) {
			if (!includeResults) {
				return next(null, count, []);
			}
			query.find();
			query.limit(Number(req.query.limit) || 1000);
			query.skip(Number(req.query.skip) || 0);
			if (sort.string) {
				query.sort(sort.string);
			}
			query.exec(function (err, items) {
				next(err, count, items);
			});
		},
	], function (err, count, items) {
		if (err) {
			res.logError('admin/server/api/list/get', 'database error finding items', err);
			return res.apiError('database error', err);
		}
		return res.json({
			results: includeResults
				? items.filter(item => item).map(function (item) {
					return req.list.getData(item, fields, req.query.expandRelationshipFields);
				})
				: undefined,
			count: includeCount
				? count
				: undefined,
		});
	});
}
