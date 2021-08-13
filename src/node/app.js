const AdminCore = require('./service-yantra-admin/app');
const StockistCore = require('./service-stockist-admin/app');
/**
 * The loader class responsible to load all apps
 *
 * */
new class App {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadAdmin();
        await this.loadSAdmin();
        this.log('Loaded the Admin!');
    }

    async loadAdmin() {
        // Default config. We can anytime override these with .env file in prod.
        process.env.COOKIE_SECRET = 'mhghghgkghjghgftdrdsgsdhjkglglglyufkfjhfkhqlifgyei746i1rt2fygew';
        process.env.APP_NAME = 'Yantra Command Center';
        // process.env.MONGO_URL = `mongodb://localhost:27017/yantra-${process.env.NODE_ENV || 'dev'}`;
        process.env.MONGO_URL = `mongodb://localhost:27017/yantra-${process.env.NODE_ENV || 'dev'}`;
        process.env.GENERATOR_SECRET = `fghhdfjdhrseseahsjhdgfhlgkgfuykftydrdjgjghfkyfktudktdtdy454rtffuriufhkjhfku666`;
        process.env.GENERATOR_ALGO = `aes-192-cbc`;
        return new Promise(resolve => new AdminCore(resolve));
    }

    async loadSAdmin() {
        return new Promise(resolve => new StockistCore(resolve));
    }

    log(...params) {
        console.log('[APP LOADER]'.bold.yellow, ':'.bold, ...params);
    }
};
