// Let there be CLI colours
require('colors');

//Load auto-stripper for JSON requires
require('autostrip-json-comments');

/**
 * Boot up the application
 * */

new class Bootloader {

    constructor() {
        this.args = process.argv;
        this.mode = this.args[2];
        this.feature = this.args[3];
        this.log({mode: this.mode, feature: this.feature});
        this.dispatch();
    }

    dispatch() {
        if (this.mode === 'single') {
            this.log('Running app as single worker.');
            require('./app.js');
        } else if (this.mode === 'full') {
            this.log('Running app as cluster.');
            require('./start.js');
        } else {
            throw new Error(`Invalid app start mode: ${this.mode}`);
        }
    }

    log(...params) {
        console.log('[BOOT LOADER]'.bold.yellow, ':'.bold, ...params);
    }

};