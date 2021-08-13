/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */
var _ = require('lodash');
var AuthService = require('../services/AuthService');
/**
 Initialises the standard view locals

 The included layout depends on the navLinks array to generate
 the navigation in the header, you may wish to change this array
 or replace it with your own templates / logic.
 */
exports.initLocals = function (req, res, next) {
	res.locals.navLinks = [
		{label: 'Home', key: 'home', href: '/'},
	];
	res.locals.user = req.user;
	next();
};
/**
 Fetches and clears the flashMessages before a view is rendered
 */
exports.flashMessages = function (req, res, next) {
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error'),
	};
	res.locals.messages = _.some(flashMessages, function (msgs) {
		return msgs.length;
	}) ? flashMessages : false;
	next();
};
/**
 Prevents people from accessing protected pages when they're not signed in
 */
exports.requireUser = function (req, res, next) {
	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/admin/signin');
	} else {
		next();
	}
};

exports.requireUserWithTargetUrl = function (url) {
	return function (req, res, next) {
		if (!req.user) {
			req.flash('error', 'Please sign in to access this page.');
			res.redirect('/admin/signin?from=' + url);
		} else {
			next();
		}
	}
};

exports.tokenAuthCommon = function (req, res, next) {

	delete req.query._;

	//TO LOGIN
	req.loginUser = function (user) {
		req._isAuthenticated = true;
		var token = AuthService.encrypt(user);
		if (token instanceof Error) {
			return res.status(500).send(token);
		}
		req._user = user;
		req.token = token;
		res.cookie('_casspvtssk', token, {
			expires: new Date(+new Date() + (24 * 60 * 60 * 1000))
		});
	};

	//TO LOGOUT
	req.logout = function () {
		req._user = null;
		req._isAuthenticated = false;
		res.cookie('_casspvtssk', '', {
			expires: new Date(+new Date() - (24 * 60 * 60 * 1000))
		});
	};
	next();

};


exports.tokenAuth = function (req, res, next) {
	var token = req.headers['authorization'] || req.headers['Authorization'] || req.query.token || (req.cookies && req.cookies['_casspvtssk'] || undefined) || undefined;

	try {
		delete req.query.token;
	} catch (c) {
		console.log(c);
	}

	if (token) {
		token = token.trim().replace(/^Bearer /, '').trim();
		var session = AuthService.decrypt(token);
		if (session instanceof Error) {
			console.log(session)
		}
		req._user = session;
	}
	next();
};

exports.tokenAuthDataClient = (req, res, next) => {
	let token = req.headers['authorization'] || req.headers['Authorization'] || undefined;
	if (!token) {
		res.status(401).send({
			error: true,
			message: 'Unauthorized'
		});
		return;
	}

	token = token.trim().replace(/^Bearer /, '').trim();
	const session = AuthService.decrypt(token);
	if (session instanceof Error) {
		res.status(401).send({
			error: true,
			message: 'Unauthorized'
		});
		return;
	}
	
	const serverTs = Date.now();
	
	if (!(session.expiry && session.expiry > serverTs)) {
		res.status(440).send({
			error: true,
			message: 'Session Expired'
		});
		return;
	}
	
	next();
};
