const keystone = require('../../ks');
const Config = keystone.list('Config').model;

exports = module.exports = async function (req, res) {
	let url = req.param('link');
	console.log(url);
	url = await asyncStringReplace(url, /--\[([^\]]+)\]--/g, async function (all, cName) {
		let config = await Config.findOne({name: cName, environment: process.env.NODE_ENV || 'development'});
		if (config) return config.value;
		else return 'invalid-config';
	});
	console.log(url);
	res.redirect('//' + url);
};


const asyncStringReplace = async (str, regex, aReplacer) => {
	const substrs = [];
	let match;
	let i = 0;
	while ((match = regex.exec(str)) !== null) {
		// put non matching string
		substrs.push(str.slice(i, match.index));
		// call the async replacer function with the matched array spreaded
		substrs.push(aReplacer(...match));
		i = regex.lastIndex;
	}
	// put the rest of str
	substrs.push(str.slice(i));
	// wait for aReplacer calls to finish and join them back into string
	return (await Promise.all(substrs)).join('');
};
