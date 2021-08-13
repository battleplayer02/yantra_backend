const {app, BrowserWindow, ipcMain} = require('electron');
const {join} = require('path');
const Printer = require('./printer');
const shell = require('shelljs');


new class LotoApp {

    constructor() {
        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        app.whenReady().then(this.createWindow.bind(this));
        app.allowRendererProcessReuse = true;

        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user quits
        // explicitly with Cmd + Q.
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit()
            }
        });

        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });

        // shell js
        shell.config.execPath = (shell.which('node').toString());

        this.bindIPC();
    }

    createWindow() {
        this.win = new BrowserWindow({
            width: 1306,
            height: 1024,
            webPreferences: {
                nodeIntegration: true
            },
            fullscreenable: true,
            // 'accept-first-mouse': true,
            'title-bar-style': 'hidden',
            titleBarStyle: 'hidden',
            frame: false,
            transparent: false,
            icon: join(__dirname, 'icon.jpg')
        });

        this.win.loadFile(join(__dirname, 'app', 'main.html'));

        // Open the DevTools. // todo stop
        console.log('Process.env.DEBUG: ', process.env.DEBUG);
        if (process.env.DEBUG === 'true') this.win.webContents.openDevTools();
    }

    bindIPC() {
        ipcMain.on('print-test-page', async (event, args) => {
            console.log(args);
            try {
                await Printer.init(args.pType, args.pPort);
                await Printer.printTestPage();
                // respond
                event.sender.send('toast', {text: 'Test page triggered. Please see if it works.', icon: 'success'});
            } catch (c) {
                console.log(c);
                event.sender.send('toast', {text: 'Printer Error. ' + c.message, icon: 'error'});
            }
        });
        ipcMain.on('print-recipt', async (event, args) => {
            console.log(args);
            try {
                await Printer.recipt(args.id, args.code, args.tid, args.gameName, args.gameEndTime, args.bkd, args.qty, args.pts, args.gnum);
            } catch (c) {
                console.log(c);
                event.sender.send('toast', {text: 'Printer Error. ' + c.message, icon: 'error'});
            }
        });
        ipcMain.on('print-red-recipt', async (event, args) => {
            console.log(args);
            try {
                await Printer.reciptRed(args.id, args.code, args.rwv, args.rwp, args.rp, args.tid, args.wNum, args.dNum);
            } catch (c) {
                console.log(c);
                event.sender.send('toast', {text: 'Printer Error. ' + c.message, icon: 'error'});
            }
        });
        ipcMain.on('print-can-recipt', async (event, args) => {
            console.log(args);
            try {
                await Printer.reciptCan(args.id, args.code, args.tid);
            } catch (c) {
                console.log(c);
                event.sender.send('toast', {text: 'Printer Error. ' + c.message, icon: 'error'});
            }
        });
        ipcMain.on('print-summary', async (event, args) => {
            console.log(args);
            try {
                await Printer.reciptSummary(args.c, args.p, args.wp, args.rp, args.bal, args.cm, args.cp, args.can, args.tid, args.dt);
            } catch (c) {
                console.log(c);
                event.sender.send('toast', {text: 'Printer Error. ' + c.message, icon: 'error'});
            }
        });
        ipcMain.on('shell-cmd', async (event, args) => {
            console.log(args);
            try {
                shell.exec(args.cmd, function (code, stdout, stderr) {
                    console.log('Exit code:', code);
                    console.log('Program output:', stdout);
                    console.log('Program stderr:', stderr);
                    if (code === 0) {
                        // respond
                        event.sender.send('toast', {text: args.message || stdout, icon: 'success'});
                    } else {
                        event.sender.send('toast', {text: [args.errorMessage || '', stderr].join('. '), icon: 'error'});
                    }
                });
            } catch (c) {
                console.log(c);
                event.sender.send('toast', {text: [args.errorMessage || '', c.message].join('. '), icon: 'error'});
            }
        });
    }
};
