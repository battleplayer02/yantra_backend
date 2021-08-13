const {fetchDataByKey, createHmacFromKey, fetchData} = require('../../services/ApiClient');
const {encrypt} = require('../../services/AuthService');

const handleToken = async (req, res) => {
	// required param validation
	const requiredParams = ['grant_type', 'api_key', 'grant_seconds', 'ts', 'assertion'];
	for (const param of requiredParams) {
		if (!req.body[param]) {
			res.status(400).send({
				error: true,
				message: `${param} is required`
			});
			return;
		}
	}

	const {grant_type, api_key, grant_seconds, ts, assertion} = req.body;
	// validate the ts for 30 sec
	const currentTs = Date.now();
	const delta = 30000;
	if (!((ts > currentTs - delta) && (ts <= currentTs + delta))) {
		res.status(440).send({
			error: true,
			message: 'Timestamp out of range'
		});
		return;
	}

	try {
		const apiClient = await fetchDataByKey(api_key);

		if (!(apiClient.grants && apiClient.grants.length && apiClient.grants.includes(grant_type))) {
			res.status(401).send({
				error: true,
				message: 'Grant type not permitted'
			});
			return;
		}

		const serverAssertion = createHmacFromKey(apiClient.secret, `${grant_type}:${api_key}:${grant_seconds}:${ts}:${apiClient.secret}`);

		if (serverAssertion !== assertion) {
			res.status(401).send({
				error: true,
				message: 'Invalid assertion'
			});
			return;
		}

		const expiry = ts + (((grant_seconds > 3600) ? 3600 : grant_seconds) * 1000);

		const token = encrypt({
			appId: apiClient._id,
			expiry,
			grant_type
		});

		if (token instanceof Error) {
			throw new Error(token);
		} else res.status(200).send({
			token,
			expiry,
			token_type: 'bearer',
			name: apiClient.name,
			scopes: apiClient.grants
		});
	} catch (err) {
		console.log(err);
		res.status(500).send({
			error: true,
			message: err.message
		});
	}
};


module.exports = {
	handleToken
};
