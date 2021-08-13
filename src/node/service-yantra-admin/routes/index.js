var keystone = require('../ks');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);
const Agendash = require('agendash');

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
const routes = {
	views: importRoutes('./views'),
	api: importRoutes('./api')
};

const dataExportRoutes = require('./data-export');

// Setup Route Bindingsf
exports = module.exports = function (app) {

	// Views
	app.get('/', routes.views.index);

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);

	// agenda dash 
	app.use('/jobs/admin', middleware.requireUserWithTargetUrl('/jobs/admin'), Agendash(_agenda));

	// mail test util
	app.use('/util/templates', middleware.requireUserWithTargetUrl('/util/templates'), routes.views.mailTemplateUtil);

	// app routes
	app.get('/redirect-to/:link', middleware.requireUserWithTargetUrl('/admin/sub-admins'), routes.api.redirectDynamic);
	app.get('/api/v1/config/public', routes.api.confPublic);
	app.post('/api/v1/config/fetch', middleware.tokenAuth, routes.api.confFetch);
	app.get('/api/v1/config/fetch', middleware.tokenAuth, routes.api.confFetch);
	app.get('/api/v1/terminal/register', routes.api.registerTerminal);
	app.get('/api/v1/terminal/connect', routes.api.connectTerminal);
	app.get('/api/v1/terminal/login', routes.api.loginTerminal);
	app.get('/api/v1/terminal/points', routes.api.fetchPoints);
	app.get('/api/v1/terminal/buy', routes.api.buy);
	app.get('/api/v1/terminal/plays', routes.api.fetchPlays);
	app.get('/api/v1/terminal/summary', routes.api.summary);
	app.get('/api/v1/terminal/redeem', routes.api.redeem);
	app.get('/api/v1/terminal/cancel', routes.api.cancel);

	// routes for data export api
	app.post('/oauth2/v1/token', dataExportRoutes.handleToken);

	// for Lead image
	app.get('/api/v1/redirect/lead-image/:slug', routes.api.leadImageRedirect);


	// temp Historical populate // todo remove
	// app.get('/temp/util/historical-user-stats', async (req, res) => {
	// 	res.send('Started...');
	// 	res.end();
	// 	const moment = require('moment');
	// 	const DailyUserStatService = require('../services/DailyUserStatService');
	// 	const DailyUserStat = require('../ks').list('DailyUserStat').model;
	// 	const Config = require('../ks').list('Config').model;
	// 	const host = await Config.findOne({name: 'mysql_host_read', environment: process.env.NODE_ENV});
	// 	const user = await Config.findOne({name: 'mysql_user_read', environment: process.env.NODE_ENV});
	// 	const database = await Config.findOne({name: 'mysql_db_read', environment: process.env.NODE_ENV});
	// 	const password = await Config.findOne({name: 'mysql_password_read', environment: process.env.NODE_ENV});
	// 	const port = await Config.findOne({name: 'mysql_port_read', environment: process.env.NODE_ENV});
	// 	const mongoUrl = await Config.findOne({name: 'mongo_url', environment: process.env.NODE_ENV});
	// 	const mongoDbName = await Config.findOne({name: 'mongo_db_name', environment: process.env.NODE_ENV});
	// 	for (let i = 1; i <= 90; i++) {
	// 		console.log('Running for idx', i);
	// 		let date = moment();
	// 		date.subtract(i.toString(), 'day');
	// 		const day = date.format('DD');
	// 		const month = date.format('MM');
	// 		const year = date.format('YYYY');
	// 		// init service
	// 		const dailyUserStatService = new DailyUserStatService(day, month, year, host.value, user.value, database.value, password.value, mongoUrl.value, mongoDbName.value, port.value);
	// 		await dailyUserStatService.init();
	// 		let stat = new DailyUserStat(await dailyUserStatService.computeAll());
	// 		stat.createdAt = new Date();
	// 		stat.updatedAt = new Date();
	// 		await stat.save();
	// 	}
	// });

};
