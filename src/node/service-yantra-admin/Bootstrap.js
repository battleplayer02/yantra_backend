const ks = require('./ks');
const sock = require('socket.io');

/**
 * This file runs for the app once on startup
 * */
class Bootstrap {

	constructor(callback) {
		this.run().then(callback);
	}

	async run() {
		await this.initSocketIO();
		await this.bootSubAdmins();
	}

	async initSocketIO() {
		const sockets = {};
		const hserver = ks.httpServer;
		const io = ks.set('io', sock.listen(hserver)).get('io');
		ks.set('send_io', (data, event, mac) => {
			// trigger send
			if (sockets[mac]) sockets[mac].emit(event, {data});
			else console.log(new Error("Failed to send message, mac not found: " + mac));
		});
		global.__io = io;

		// Socket function
		io.on('connection', function (socket) {
			console.log('Socket connected....');

			socket.on('handshake', function (mac) {
				console.log("Handshake request:", mac);
				sockets[mac] = socket;
				socket._mac = mac;
				socket.emit('shakeback', {mac, time: +new Date()})
			});

			socket.on('disconnect', () => {
				console.log('Terminal disconnected!', socket._mac);
				delete sockets[socket._mac || 'null'];
			});
		});
	}

	async bootSubAdmins() {
		// const SubAdmin = ks.list('SubAdmin').model;
		// const admins = [
		// 	{
		// 		name: 'Skynet Jobs Admin',
		// 		description: 'Manage all jobs running in skynet command center.',
		// 		link: '/jobs/admin'
		// 	},
		// 	{
		// 		name: 'API Cache Admin - Velociraptor',
		// 		description: 'Manage the API cache database.',
		// 		link: '/redirect-to/api-cache-management.--[host]--'
		// 	},
		// 	{
		// 		name: 'CAMS ADMIN',
		// 		description: 'Manage the Cards for apps. CArd Management System',
		// 		link: '/redirect-to/cams-admin.--[host]--'
		// 	}
		// ];
		// for (let idx = 0; idx < admins.length; idx++) {
		// 	let admin = admins[idx];
		// 	let adminDb = await SubAdmin.findOne({name: admin.name});
		// 	if (!adminDb) adminDb = new SubAdmin(admin);
		// 	else {
		// 		adminDb.name = admin.name;
		// 		adminDb.description = admin.description;
		// 		adminDb.link = admin.link;
		// 	}
		// 	await adminDb.save();
		// }
	}
}

exports = module.exports = Bootstrap;
