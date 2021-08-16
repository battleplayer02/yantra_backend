const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * BotUser Model
 * ==========
 */

const BotUser = new keystone.List('BotUser', { track: true, nodelete: false, map: { name: 'mac' } });

BotUser.add({
    chatID: { type: Types.Text, required: true, initial: true },
    isVerified: { type: Types.Boolean, initial: true, default: false, index: true },
    isRegistered: { type: Types.Boolean, initial: true, default: false, index: true },
    username: { type: Types.Text, required: true, index: true, initial: true },
    balance: { type: Types.Number, default: 0, initial: true },

}, "Linked To", {
    retailer: {
        type: Types.Relationship,
        ref: "Retailer",
        index: true,
        initial: false,
        noedit: true,
        nocreate: true
    }
});



/**
 * Registration
 */
BotUser.defaultColumns = 'mac, retailer, enabled, updatedAt, updatedBy';
BotUser.register();
