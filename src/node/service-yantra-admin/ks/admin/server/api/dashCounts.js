/**
 * Simple API for dash counts
 * */
module.exports = async function (req, res) {
	let keystone = req.keystone;
	let counts = {};
	const Agent = keystone.list('Agent').model;
	const Worker = keystone.list('Worker').model;
	const Config = keystone.list('Config').model;
	const ReportedError = keystone.list('ReportedError').model;

	counts['agentsRunning'] = await Agent.count({status: 'ONLINE'});
	counts['totalAgents'] = await Agent.count();
	counts['workersRunning'] = await Worker.count({status: 'ONLINE'});
	counts['totalWorkers'] = await Worker.count();
	counts['numConfigs'] = await Config.count();
	counts['openErrors'] = await ReportedError.count({isComplete: false});
	counts['totalErrors'] = await ReportedError.count();

	let sod = new Date();
	sod.setMilliseconds(0);
	sod.setSeconds(0);
	sod.setMinutes(0);
	sod.setHours(0);
	let eod = new Date();
	eod.setMilliseconds(999);
	eod.setSeconds(59);
	eod.setMinutes(59);
	eod.setHours(23);

	counts['errorsToday'] = await ReportedError.count({createdAt: {$gt: sod, $lt: eod}});

	res.send(JSON.stringify(counts));
};
