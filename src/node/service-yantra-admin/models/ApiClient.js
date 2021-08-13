const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * Api Client Model
 * ==========
 */
const ApiClient = new keystone.List('ApiClient', {track: true, defaultSort: '-createdAt'});
ApiClient.add({
	key: {type: Types.Text, initial: true, index: true},
	secret: {type: Types.Text, initial: true},
	name: {type: Types.Text, initial: true},
	description: {type: Types.Textarea, initial: true},
	grants: {
		type: Types.SelectArray, initial: true, options: [
			'config:agent',
			'config:production',
			'config:preprod',
			'config:staging',
			'config:qa',
			'config:test',
			'config:development',
			'runner:agent',
			'runner:scripts',
			'runner:stats'
		]
	}
});

/**
 * Registration
 */
ApiClient.defaultColumns = 'key, secret, name, description, grants';
ApiClient.register();


