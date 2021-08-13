const NginxUtils = require('../src/node/service-command-center/utils/NginxUtils');
const assert = require('assert');

/**
 * The test runner class.
 * */
class Test {

    constructor(name, ...args) {
        console.log(`Running test with name "${name}" and arguments ${args}`);
        // sample test credentials
        this[name] && this[name].apply(this, args) || console.log('No test with specified name');
    }

    async all(args) {
        console.log('No Combined test yet. TODO code!');
        return true;
    }

    parseNginxStatus() {
        const staus = "Active connections: 610 \nserver accepts handled requests\n 44740 44740 147020 \nReading: 0 Writing: 2 Waiting: 606 \n";
        const data = NginxUtils.parseNginxBasicStats(staus);
        console.log(data);
        assert(data.activeConnections === 610);
    }


}

// Trigger
new Test(process.argv[2], process.argv.slice(3));
