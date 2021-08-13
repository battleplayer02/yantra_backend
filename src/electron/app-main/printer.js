// ESC POS
const escpos = require('escpos');
// escpos.USB = require('escpos-usb');
// escpos.Serial = require('escpos-serialport');
// escpos.Network = require('escpos-network');
escpos.Parallel = require('./escpos_parallel');
let escposPrt = null; // configured escpos printer driver
let escposDev = null; // configured escpos printer hardware

exports = module.exports = class Printer {

    static fixDate(inDate, tz){
        let date = new Date();
        let invdate = new Date(date.toLocaleString('en-US', {
            timeZone: tz || 'Asia/Kolkata'
        }));
        let diff = date.getTime() - invdate.getTime();
        return new Date(inDate.getTime() - diff);
    }

    static async init(pType, pPort) {
        try {
            switch (pType) {
                case 'Network':
                    // escposDev = new escpos.Network(pPort);
                    throw new Error('Printer not found');
                    break;
                case 'Parallel':
                    escposDev = new escpos.Parallel('/dev/' + pPort);
                    break;
                case 'Serial':
                    // escposDev = new escpos.Serial('/dev/' + pPort);
                    throw new Error('Printer not found');
                    break;
                case 'USB':
                    // if (pPort === 'auto') escposDev = new escpos.USB();
                    // else escposDev = new escpos.Serial('/dev/' + pPort);
                    throw new Error('Printer not found');
                    break;
                default:
                    throw new Error('No supported printer configurations.');
            }
            escposPrt = new escpos.Printer(escposDev, {width: 32});
        } catch (c) {
            throw c;
        }
    }

    static async printTestPage() {
        if (!escposPrt || !escposDev) throw new Error('Printer not initialized yet.');
        await new Promise((res, rej) => {
            escposDev.open(function (error) {
                if (error) rej(error);
                else res();
            });
        });
        escposPrt
            .font('a')
            .marginRight(120)
            .align('ct')
            .style('bu')
            // .size(1, 1)
            .text('YANTRA')
            .font('a')
            .barcode('1234567AZ32', 'CODE39', {height: 40})
            .align('ct')
            .table(["One", "Two", "Three"])
            .font('a')
            .marginRight(120)
            .align('ct')
            .tableCustom(
                [
                    {text: "Left", align: "LEFT", width: 0.33, style: 'B'},
                    {text: "Center", align: "CENTER", width: 0.33},
                    {text: "Right", align: "RIGHT", width: 0.33}
                ],
                {encoding: 'cp857', size: [1, 1]}
            )
            .feed()
            .cut()
            .close()
    }

    static async recipt(id, code, tid, gameName, gameEndTime, bkd, qty, pts, gnum) {
        if (!escposPrt) return;
        escposPrt
            .font('a')
            .align('ct')
            .style('B')
            // .size(1, 1)
            .text('YANTRA')
            .align('LT')
            .style('NORMAL')
            .text(`Game Code: ${gnum}`)
            .text(`${Printer.fixDate(new Date()).toISOString().replace('T', ' ').replace(/\.\d\d\d\w/, '')}`)
            .text(`POS ID: ${tid.toString().toUpperCase()}`)
            .text(`----------------------`)
            // .align('ct')
            // .style('B')
            // .size(1, 1)
            // .text(gameName)
            // .text(new Date(gameEndTime).toISOString().replace(/^(.+)T(\d\d:\d\d).+$/i, 'Date: $1 Time: $2'))
            .align('lt')
            .style('NORMAL')
            .text(Object.keys(bkd).map((key, idx) => `${(idx % 4) === 0 ? '\n' : ''}YT${key} *${bkd[key]}`).join('  '))
            .style('B')
            .text(`Product Qty ${qty} Total Pts. ${pts}`)
            .style('NORMAL')
            .text('*Amusement Only')
            .barcode(code, 'CODE39', {height: 40})
            .feed()
            .cut()
            .close()
    }

    static async reciptRed(id, code, rwv, rwp, rp, tid, wNum, dNum) {
        if (!escposPrt) return;
        escposPrt
            .font('a')
            .align('ct')
            .style('B')
            // .size(1, 1)
            .text('YANTRA')
            .align('LT')
            .style('NORMAL')
            .text(`Game Code: ${dNum}`)
            .text(`${Printer.fixDate(new Date()).toISOString().replace('T', ' ').replace(/\.\d\d\d\w/, '')}`)
            .text(`POS ID: ${tid.toString().toUpperCase()}`)
            .text(`----------------------`)
            .align('ct')
            .style('B')
            // .size(1, 1)
            .text(`WINNER! #${wNum} - ${rp}P`)
            .align('lt')
            .text(`Total Val. ${rwv}`)
            .style('NORMAL')
            .text('*Amusement Only')
            .barcode(code, 'CODE39', {height: 40})
            .feed()
            .cut()
            .close()
    }

    static async reciptCan(id, code, tid) {
        if (!escposPrt) return;
        escposPrt
            .font('a')
            .align('ct')
            .style('B')
            // .size(1, 1)
            .text('YANTRA')
            .align('LT')
            .style('NORMAL')
            .text(`Ack.Coupon ${id}`)
            .text(`${Printer.fixDate(new Date()).toISOString().replace('T', ' ').replace(/\.\d\d\d\w/, '')}`)
            .text(`POS ID: ${tid.toString().toUpperCase()}`)
            .text(`----------------------`)
            .align('ct')
            .style('B')
            // .size(1, 1)
            .text('CANCELLED')
            .align('lt')
            .text(`Ticket No More Valid`)
            .style('NORMAL')
            .text('*Amusement Only')
            .barcode(code, 'CODE39', {height: 40})
            .feed()
            .cut()
            .close()
    }

    static async reciptSummary(c, p, wp, rp, bal, cm, cp, can, tid, dt) {
        if (!escposPrt) return;
        escposPrt
            .font('a')
            .align('ct')
            .style('B')
            // .size(1, 1)
            .text('YANTRA')
            .align('LT')
            .style('NORMAL')
            .text(`${Printer.fixDate(new Date()).toISOString().replace('T', ' ').replace(/\.\d\d\d\w/, '')}`)
            .text(`POS ID: ${tid.toString().toUpperCase()}`)
            .text(`----------------------`)
            .align('ct')
            .style('B')
            .text('POS Report')
            .text(' ')
            .style('NORMAL')
            .text(`Date: ${dt}`)
            .text(`M.Pts: ${p.toFixed(2)}`)
            .text(`F.Pts: ${rp.toFixed(2)}`)
            .text(`G.P: ${cm.toFixed(2)}`)
            .text(`Bal: ${bal.toFixed(2)}`)
            .text(`Cancel: ${can.toFixed(2)}`)
            .text(`Total Pts Coll: ${(bal - can).toFixed(2)}`)
            .feed()
            .cut()
            .close()
    }

};
