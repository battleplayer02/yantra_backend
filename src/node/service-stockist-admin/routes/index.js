var keystone = require('../ks');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);

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

	// mail test util
	app.use('/util/templates', middleware.requireUserWithTargetUrl('/util/templates'), routes.views.mailTemplateUtil);

	// app routes
	app.get('/redirect-to/:link', middleware.requireUserWithTargetUrl('/admin/sub-admins'), routes.api.redirectDynamic);

	// routes for data export api
	app.post('/oauth2/v1/token', dataExportRoutes.handleToken);

	// for Lead image
	app.get('/api/v1/redirect/lead-image/:slug', routes.api.leadImageRedirect);



};
