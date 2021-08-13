var keystone = require('../../ks');
// const EmailService = require('../../services/EmailService');

exports = module.exports = function (req, res) {

	if (req.method.toLowerCase() === 'get') {
		return res.render('mailTemplateUtil');
	} else if (req.method.toLowerCase() === 'post') {
		console.log('Sending', req.body.html, req.body.email);
		EmailService.sendHTML(req.body.email, req.body.html, "TEST MAIL DEV.", (err, resp) => {
			if (err)  return console.log(err);
			return res.render('mailTemplateUtil', {message: 'sent', html: req.body.html, email: req.body.email || ''});
		});
	}
};
