// Load config
require('dotenv').config();

// Modules
const ks = require('./ks');
const {mapSeries} = require('async');
const {readdirSync} = require('fs');
const {join} = require('path');
const handlebars = require('express-handlebars');
const Bootstrap = require('./Bootstrap');


/**
 * Boot Admin Keystone App
 * Class responsible for Keystone boot process
 * */
class BootAdminCore {

	constructor(done) {
		this.log('Loading ADMIN...');
		this.initState();
		this.mongoUrl = process.env.OVERRIDE_MONGO_URL || process.env.MONGO_URL;
		this.initCore();
		// env default
		process.env.NODE_ENV = process.env.NODE_ENV || 'development';
		done();
	}

	set mongoUrl(url) {
		this.log('Setting MongoUrl as:', url);
		this.config['murl'] = url;
	}

	get mongoUrl() {
		if (this.config['murl']) return this.config['murl'];
		else throw new Error('Mongo URL not specified, though attempted to fetch before it was initialized. Illegal access.');
	}

	get nav() {
		return {
			Users: ['Retailer'],
			Accounts: ['CreditLedgerEntry'],
			Reports: ['RetailerDayWiseReport']
		};
	}

	async initCore() {
		ks.init({
			'name': process.env.APP_NAME,
			'brand': `The ${process.env.APP_NAME}`,
			'less': 'public',
			'static': 'public',
			'favicon': 'public/favicon.png',
			'views': 'templates/views',
			'view engine': '.hbs',
			'admin path': 'admin',
			'custom engine': handlebars.create({
				layoutsDir: join(__dirname, 'templates/views/layouts'),
				partialsDir: join(__dirname, 'templates/views/partials'),
				defaultLayout: 'default',
				helpers: new require('./templates/views/helpers')(),
				extname: '.hbs',
			}).engine,
			'emails': 'templates/emails',
			'auto update': true,
			'session': true,
			'auth': true,
			'user model': 'AdminUser',
			'signin logo': {src: '/yantra-sm.jpg', width: '100%'},
			'cloudinary config': {
				cloud_name: 'xprep',
				api_key: '812117724195545',
				api_secret: 'Ib-HR8RNbUZ6CCU6XgPCiBvhNs0'
			},
			'port': '9735'
		});
		// models dir
		ks.import('models');

		ks.set('locals', {
			_: require('lodash'),
			env: ks.get('env'),
			utils: ks.utils,
			editable: ks.content.editable,
		});
		ks.set('routes', require('./routes'));
		ks.set('cors allow origin', true);
		ks.set('cookie secret', process.env.COOKIE_SECRET || 'asdasddqewfdefqefwefewt56456e');
		ks.set('nav', this.nav);
		ks.start({
			onStart: () => new Bootstrap(() => console.log('App Bootstrapped Successfully.'))
		});
	}

	initState() {
		this.log('Initializing state...');
		this.config = {};
	}

	log(...params) {
		console.log('[STOCKIST BOOT LOADER]'.bold.yellow, ':'.bold, ...params);
	}

	addSafeReadOnlyGlobal(prop, val) {
		Object.defineProperty(global, prop, {
			get: function () {
				return val;
			},
			set: function () {
				console.log('You are trying to set the READONLY GLOBAL variable `', prop, '`. This is not permitted. Ignored!');
			}
		});
	}

}

exports = module.exports = BootAdminCore;
