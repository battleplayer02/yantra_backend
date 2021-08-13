'use strict';
const shelljs = require('shelljs');
const fs = require('fs');

function USB(vid, pid) {

    this.device = 'lp0';
    if (!this.device)
        throw new Error('Can not find printer');

    return this;

}

/**
 * [open usb device]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
USB.prototype.open = function (callback) {
    if (callback) callback();
    return this;

};

/**
 * [function write]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
USB.prototype.write = function (data, callback) {
    let fn = Math.random() + '_' + Math.random();
    fs.writeFileSync('/tmp/' + fn, data);
    shelljs.exec(`cat /tmp/${fn} > /dev/lp0`);
    if (callback) callback();
    return this;
};

USB.prototype.close = function (callback) {
    if (callback) callback();
    return this;

};

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = USB;
