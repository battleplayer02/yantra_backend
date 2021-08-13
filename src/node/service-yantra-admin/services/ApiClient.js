const crypto = require('crypto');
const keystone = require('../ks');
const ApiClient = keystone.list('ApiClient').model;


const fetchDataByKey = async (key) => {
	try {
		const result = await ApiClient.findOne({key});
		return result.toJSON();
	} catch (err) {
		throw new Error(err);
	}
};

const createHmacFromKey = (key, text) => {
	return crypto.createHmac('sha256', key).update(text).digest('hex');
};

module.exports = {
	fetchDataByKey,
	createHmacFromKey
};
