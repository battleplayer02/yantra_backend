/**
 * Nginx utils class
 * */

class NginxUtils {

	static parseNginxBasicStats(status) {
		const data = {
			activeConnections: 0,
			accepts: 0,
			handled: 0,
			requests: 0,
			reading: 0,
			writing: 0,
			waiting: 0
		};
		status.replace(/^ *active connections: ?(\d+)[\w\d\s\W\D\S]+?(\d+) +(\d+) +(\d+)[\w\d\s\W\D\S]+?: ?(\d+).+: ?(\d+).+: ?(\d+) [\w\d\s\W\D\S]$/ig,
			(all, activeConnections, accepts, handled, requests, reading, writing, waiting) => {
				Object.assign(data, {
					activeConnections: parseInt(activeConnections, 10),
					accepts: parseInt(accepts, 10),
					handled: parseInt(handled, 10),
					requests: parseInt(requests, 10),
					reading: parseInt(reading, 10),
					writing: parseInt(writing, 10),
					waiting: parseInt(waiting, 10)
				});
			});
		return data;
	}

}

exports = module.exports = NginxUtils;
