const {ipcRenderer} = require('electron');
const macaddress = require('macaddress');
const wifi = require("node-wifi");
wifi.init({iface: null});
const axios = require('axios');
const fs = require('fs');
const https = require('https');
let http;

// override LS
window.__ls = window.localStorage;
window.localStorage = {
    getItem: function (key) {
        let val;
        try {
            val = fs.readFileSync(`/mnt/sda1/_ls_${key.replace(/[^a-z0-9]/ig, '_')}.ls`).toString();
        } catch (c) {
            console.log(c);
            val = window.__ls.getItem(key);
        }
        return val;
    },
    setItem: function (key, val) {
        try {
            fs.writeFileSync(`/mnt/sda1/_ls_${key.replace(/[^a-z0-9]/ig, '_')}.ls`);
        } catch (c) {
            console.log(c);
            window.__ls.setItem(key, val);
        }
    }
};

const app = new Vue({
    el: '#v-app',
    data: {
        version: 'v1.2.4-beta',
        activeDialog: false,
        // wifi
        wifiError: null,
        wifiScanning: false,
        wifiNetworks: [],
        // terminal: null
        terminal: null,
        terminalIntrim: null,
        selectMatrix: [],
        isConnected: false,
        baseUrl: "https://admin.yantra.ml",
        // baseUrl: "http://0.0.0.0:3000",
        mac: '',
        // Printer
        pPort: null, // printer select
        pType: null, // printer select
        printers: [
            {t: 'USB', ports: ['auto', 'usb/lp0', 'usb/lp1', 'usb/lp2']},
            {t: 'Serial', ports: ['ttyS0', 'ttyS1', 'ttyS2', 'ttyS3']},
            {t: 'Parallel', ports: ['lp0', 'lp1', 'lp2', 'lp3']},
            // {t: 'Bluetooth', ports: ['lp0', 'lp1', 'lp2', 'lp3']},
            {t: 'Network', ports: ['localhost']},
        ],
        printerHit: false,
        printer: null, // {ptype:'', port: ''}
        // login
        un: '',
        pw: '',
        // misc
        isCheckedIn: false,
        game: null, // game info
        gamePlay: null, // game instance
        gcanBuy: false,
        gfrozen: false,
        gspinner: false,
        gresult: false,
        gCredits: 0,
        gPlays: [],
        ctdn: 'Waiting',
        sTime: null, // server time
        sToken: 'yb:sljkjdlaskjdjlakjsdlk334lkjfalfj@alkfdj203rhqlefhljfwejkfhiufhiefhuwhflugfifghiwhgf',
        currCell: {row: 0, col: 0},
        highlight: {},
        lastPurchase: null,
        ctrPid: null,
        ctrN: '',
        mCurrIdx: -1,
        curtime: '',
        purLocked: false
    },
    created() {
        try {
            window.vueLoaded();
        } catch (c) {
            console.log(c.message);
        }
        /**
         * Networking connect
         * */
        // connect socket io
        console.log('Starting socket connection', this.baseUrl);
        const socket = io(this.baseUrl);
        socket.on('connect', () => {
            console.log('Socket connected!');
            this.isConnected = socket.connected;
        });
        socket.on('disconnect', () => {
            console.log('Socket Disconnected');
            this.isConnected = socket.connected;
        });
        window._socket = socket;

        // todo make better in future
        macaddress.one().then(mac => {
            this.mac = mac;
        });
        macaddress.all().then(mac => {
            console.log(mac);
        });
        setTimeout(() => {
            if (!this.mac) {
                let mac;
                try {
                    mac = fs.readFileSync('/mnt/sda1/mac.txt').toString();
                } catch (c) {
                    console.log(c);
                }
                if (!mac) {
                    mac = 'yt:xx:xx:xx:xx'.replace(/x/ig, () => (~~(Math.random() * 16)).toString(16)).toUpperCase();
                    this.mac = mac;
                    fs.writeFileSync('/mnt/sda1/mac.txt', mac);
                }
                this.mac = mac;
            }
        }, 2000);

        if (window.localStorage) {
            console.log('getting from LS');
            if (window.localStorage.getItem("_printer")) {
                this.printer = JSON.parse(window.localStorage.getItem("_printer"));
                this.pType = this.printer.pType;
                this.pPort = this.printer.pPort;
                this.doTestPrint();
                this.printerHit = true;
            }
            if (window.localStorage.getItem("_terminalIntrim")) {
                this.terminalIntrim = JSON.parse(window.localStorage.getItem("_terminalIntrim"));
            }
        }

        // listen ipc
        ipcRenderer.on('toast', (event, args) => {
            console.log(args);
            Swal.fire({
                position: 'top-end',
                icon: args.icon,
                title: args.text,
                showConfirmButton: false,
                timer: 2000,
                backdrop: false
            });
        });

        // http
        http = axios.create({
            baseURL: this.baseUrl,
            headers: {
                Authorization: this.sToken
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        this.bindMenuKeys();

        let date = new Date();
        let invdate = new Date(date.toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata'
        }));
        let diff = date.getTime() - invdate.getTime();
        setInterval(() => {
            let date = new Date(new Date().getTime() - diff);
            let hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
            let am_pm = date.getHours() >= 12 ? "PM" : "AM";
            hours = hours < 10 ? "0" + hours : hours;
            let minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
            let seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
            this.curtime = hours + ":" + minutes + ":" + seconds + " " + am_pm;
        }, 1000);

        window.buyTest = async () => {
            let is = `1 1888 1444 1126 3161 3470
2 3593 2130 4868 1731 1445
3 2264 1032 4211 2420 4743
4 3339 4513 1416 3960 4446
5 4712 3750 4143 4368 2867
6 3352 3928 1852 3712 2431
7 1321 2340 2375 3809 4252
8 1587 2061 3860 2966 4214
9 4447 4925 2955 2486 1692
10 4591 4709 3233 1169 3530
11 1627 3155 4142 2140 4464
12 2543 1724 2218 1143 5004
13 2755 5021 2844 3393 1262
14 3537 3646 3106 1968 2623
15 4948 4764 3555 3911 5034
16 1716 2498 4681 4090 4027
17 2305 2136 3298 2244 2655
18 2789 5047 4045 2391 4158
19 1210 3040 2666 1132 3684
20 1505 1987 2275 4117 3937
21 1598 1816 1446 2823 1639
22 2009 2686 4255 4840 1615
23 2077 2887 4771 3052 2688
24 1327 4189 3525 1299 2715
25 3276 2479 5008 3774 2853
26 1265 2426 4221 1218 1752
27 2899 2749 2569 3837 4604
28 3579 2967 2272 1038 2873
29 2336 3720 2795 4367 4281
30 3140 1547 1606 3973 4245
31 2005 4785 2367 3931 5033
32 3431 4315 3204 1479 1378
33 2224 3730 2169 1976 2401
34 4735 2395 2679 4661 4606
35 1059 2586 4217 3050 3925
36 3887 2146 3844 3385 3053
37 1345 2513 3495 1219 2850
38 2735 2754 3694 3259 4807
39 2781 4392 3071 4241 4212
40 4586 4473 2454 1621 3978
41 3355 4284 4144 4064 3092
42 1409 4855 3884 3016 1574
43 2488 1894 1798 1565 2481
44 3131 1323 3848 4730 2825
45 1297 3310 3570 2435 3175
46 4205 2568 1230 3289 2382
47 4801 2680 1002 4161 3913
48 1695 4444 2857 2231 1843
49 1880 3756 4374 1784 1750
50 1393 4564 4930 2743 3954
51 4381 2628 2590 2772 2220
52 4694 4351 3943 4565 3942
53 2177 1247 3568 4453 4625
54 3670 4954 3742 1628 4690
55 1659 3400 3660 3014 1911
56 1040 2108 4426 4543 1021
57 3961 1083 3620 3930 4334
58 1124 2343 4809 5053 1337
59 1020 1474 2843 1417 2764
60 3247 2783 3024 4853 4173
61 3923 3667 5032 2892 1749
62 2643 4506 1109 2269 1631
63 4181 1374 4360 3398 1555
64 2142 3224 3600 2614 2172
65 2317 1384 4536 1664 4663
66 4656 3506 4750 4331 2562
67 3738 2537 2652 4118 4145
68 4319 4077 4177 1495 2086
69 4480 3440 3185 3625 2414
70 4353 1902 3796 3829 3090
71 1512 1070 3920 4534 1840
72 4109 2248 3518 1339 1564
73 3781 3250 4285 3725 4535
74 4486 2450 3605 2087 3262
75 1025 2183 1814 1662 3038
76 4410 4788 4951 2807 4465
77 3232 2722 4230 1448 4693
78 2927 3835 3894 1217 1162
79 4404 4198 4767 3895 2089
80 3066 5058 4836 2106 4654
81 4813 2079 4490 1144 4929
82 1509 4784 4052 2368 2057
83 3539 2865 3336 4376 2502
84 3172 4433 1865 4999 3826
85 2338 3221 3855 1406 3880
86 2607 3244 1822 3969 1540
87 2376 3455 2978 4098 1200
88 2638 3463 1089 2501 3903
89 1182 3526 2909 1521 3278
90 2750 3009 4166 2293 1361
91 2624 4150 3370 2069 4894
92 3865 2559 3134 2403 1873
93 2579 1484 3051 4110 4678
94 1084 1935 2100 2961 4668
95 1575 3789 4665 3572 2490
96 1836 1706 2150 3181 1119
97 4648 1459 4885 2641 1903
98 3357 1890 1087 4186 3934
99 2036 4620 1293 1421 1812`;
            let lines = is.split('\n');
            let bkd1 = {};
            let bkd2 = {};
            let bkd3 = {};
            let bkd4 = {};
            let bkd5 = {};
            lines.forEach(line => {
                let tks = line.split(' ').map(t => t.trim());
                console.log(tks);
                bkd1[tks[0]] = parseInt(tks[1], 10);
                bkd2[tks[0]] = parseInt(tks[2], 10);
                bkd3[tks[0]] = parseInt(tks[3], 10);
                bkd4[tks[0]] = parseInt(tks[4], 10);
                bkd5[tks[0]] = parseInt(tks[5], 10);
            });
            [bkd1, bkd2, bkd3, bkd4, bkd5].forEach(async bkd => {
                console.log(bkd);
                let p = 0;
                let v = 0;
                Object.keys(bkd).forEach(key => p = p + bkd[key]);
                v = p * this.game.pointValue;
                let num = `${'..............'.replace(/./g, () => (~~(Math.random() * 10)).toString(10))}`;
                let code = `${this.terminalIntrim._id.toString().replace(/^.+(...)$/, '$1')}${this.gamePlay._id.toString().replace(/^.+(...)$/, '$1')}${p}${'....'.replace(/./g, () => (~~(Math.random() * 24)).toString(24))}`.toUpperCase();
                try {
                    let resp = await http.get(`/api/v1/terminal/buy?mac=${encodeURIComponent(this.mac)}&tid=${encodeURIComponent(this.terminalIntrim._id)}&rid=${encodeURIComponent(this.terminalIntrim.retailer)}&ec=${encodeURIComponent(this.terminalIntrim.ec)}&gid=${encodeURIComponent(this.game._id)}&gpid=${encodeURIComponent(this.gamePlay._id)}&p=${p}&v=${v}&bkd=${encodeURIComponent(JSON.stringify(bkd))}&num=${num}&code=${code}`);
                    console.log(resp);
                } catch (c) {
                    console.log(c);
                }
            });
        };
    },
    methods: {
        /**
         * Wifi
         * */
        closeWifiDialog() {
            this.activeDialog = false;
        },
        async openWifiDialog() {
            ipcRenderer.send('shell-cmd', {
                cmd: 'sudo xterm -geometry 100x100 -bg white -fg black -bw 0 -fn 12x24 -e /mnt/sda1/app/app/_wifi.sh &',
                message: 'Wifi Configured',
                errorMessage: 'Wifi Configure Error'
            });
            return;

            this.activeDialog = 'wifi';
            layoutNewComponent("#wifi-dialog");
            this.wifiError = null;
            this.wifiScanning = true;
            this.wifiNetworks = [];
            try {
                let networks = await wifi.scan();
                console.log(networks);
                let networks_temp = [];
                networks.filter((item) => {
                    // Check whether we already have this SSID in our results // Add it to the networks_temp array if we don't
                    let i = networks_temp.findIndex(x => x.ssid === item.ssid);
                    if (i <= -1) {
                        networks_temp.push(item);
                        return;
                    }
                    // Check whether the signal quality - with a small margin - is higher or not
                    // Skip this network if it's much weaker anyways
                    if ((item.quality + 5) < networks_temp[i].quality) return;
                    // Check whether new network is using 5GHz or not
                    // Skip this network if it's using 2.4GHz anyways
                    if ((item.frequency) < 3000) return;
                    // The network is 5GHz *and* has a relatively higher signal, use it insead.
                    networks_temp.splice(i, 1);
                    networks_temp.push(item);
                });
                // get connected wifi
                let currentNetworks = await wifi.getCurrentConnections();
                console.log(currentNetworks);
                if (currentNetworks && currentNetworks.length) {
                    currentNetworks.forEach(cn => networks_temp.forEach(nt => nt.connected = nt.ssid === cn.ssid));
                }
                this.wifiNetworks = networks_temp;
                this.wifiScanning = false;
            } catch (c) {
                console.log(c);
                this.wifiScanning = false;
                // this.wifiNetworks = [];
                this.wifiError = c.message;
            }
        },
        /**
         * Printer
         * */
        printerChange() {
            this.pPort = this.fetchPrinterPorts()[0];
        },
        fetchPrinterPorts() {
            return ((this.printers.find(p => this.pType === p.t) || {}).ports) || [];
        },
        openPrinterDialog() {
            if (!this.pType) this.pType = this.printers[0].t;
            if (!this.pPort) this.printerChange();
            this.activeDialog = 'printer';
            layoutNewComponent("#printer-dialog");
        },
        closePrinterDialog() {
            this.activeDialog = false;
        },
        async doTestPrint() {
            ipcRenderer.send('print-test-page', {
                pType: this.pType,
                pPort: this.pPort
            });
            this.printerHit = true;
        },
        savePrinterSettings() {
            if (!this.printerHit) {
                this.printer = null;
                return Swal.fire({
                    position: 'top-end',
                    icon: 'error',
                    title: 'Please fire a test print first.',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
            this.printer = {
                pType: this.pType,
                port: this.pPort
            };
            if (window.localStorage) {
                console.log('Saving in LS');
                window.localStorage.setItem("_printer", JSON.stringify(this.printer));
            }
            this.activeDialog = false;
        },
        /**
         * Offline messsage
         * */
        showOfflineToast() {
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: 'Offline!',
                text: "Please connect to internet first.",
                showConfirmButton: false,
                timer: 2000
            });
        },
        /**
         * Register Dialog
         * */
        openRegisterDialog() {
            if (!this.isConnected) {
                return this.showOfflineToast();
            }
            if (!this.printer) {
                return Swal.fire({
                    position: 'top-end',
                    icon: 'error',
                    title: 'Please setup printer first.',
                    showConfirmButton: false,
                    timer: 2000
                })
            }
            this.activeDialog = 'register';
            layoutNewComponent("#register-dialog");
        },
        closeRegisterDialog() {
            this.activeDialog = false;
        },
        async confirmRegisterationCode() {
            this.activeDialog = false;
            // if (!this.mac) {
            //     let mac;
            //     try {
            //         mac = fs.readFileSync('/mnt/sda1/mac.txt');
            //         if (!mac) {
            //             mac = 't:xx:xx:xx:xx:xx'.replace(/x/ig, () => (~~(Math.random() * 16)).toString(16)).toUpperCase();
            //         }
            //         fs.writeFileSync('/mnt/sda1/mac.txt', mac);
            //     } catch (c) {
            //         console.log(c);
            //     }
            //     if (!mac) {
            //         mac = 't:xx:xx:xx:xx:xx'.replace(/x/ig, () => (~~(Math.random() * 16)).toString(16)).toUpperCase();
            //     }
            //     this.mac = mac;
            // }
            try {
                let resp = await http.get(`/api/v1/terminal/register?mac=${encodeURIComponent(this.mac)}`);
                console.log(resp);
                if (resp && resp.data && resp.data.success) {
                    if (!resp.data.data.enabled) throw new Error('Terminal is disabled.');
                    // if(!resp.data.retailer || !resp.data.r) throw new Error('Terminal not authorized yet.');
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'Terminal registered.',
                        showConfirmButton: false,
                        timer: 2000
                    });
                    this.terminalIntrim = resp.data.data;
                    if (window.localStorage) {
                        window.localStorage.setItem("_terminalIntrim", JSON.stringify(this.terminalIntrim));
                    }
                } else throw new Error(resp && resp.data && resp.data.error || 'Unable to register.');
            } catch (c) {
                console.log(c);
                Swal.fire({
                    position: 'top-end',
                    icon: 'error',
                    title: c.message,
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        },
        /**
         * Connect Dilog
         * */
        openConnectDialog() {
            if (!this.terminalIntrim) {
                return Swal.fire({
                    position: 'top-end',
                    icon: 'error',
                    title: 'Please register first.',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
            this.activeDialog = 'connect';
            layoutNewComponent("#connect-dialog");
            setTimeout(() => jQuery('.y_btn').eq(0).focus(), 200);
        },
        async doConnection() {
            this.activeDialog = false;
            if (this.terminalIntrim && this.terminalIntrim.ec) {
                return Swal.fire({
                    position: 'top-end',
                    icon: 'warning',
                    title: 'Terminal already connected. Please proceed to login.',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
            try {
                let resp = await http.get(`/api/v1/terminal/connect?mac=${encodeURIComponent(this.mac)}&tid=${encodeURIComponent(this.terminalIntrim._id)}`);
                console.log(resp);
                if (resp && resp.data && resp.data.success) {
                    if (!resp.data.data.enabled) throw new Error('Terminal is disabled.');
                    if (!resp.data.data.retailer || !resp.data.data.r) throw new Error('Terminal not authorized yet.');
                    if (!resp.data.data.ec) throw new Error('Terminal not authorized yet (ec).');
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'Terminal connected.',
                        showConfirmButton: false,
                        timer: 2000
                    });
                    this.terminalIntrim = resp.data.data;
                    if (window.localStorage) {
                        window.localStorage.setItem("_terminalIntrim", JSON.stringify(this.terminalIntrim));
                    }
                } else throw new Error(resp && resp.data && resp.data.error || 'Unable to connect.');
            } catch (c) {
                console.log(c);
                Swal.fire({
                    position: 'top-end',
                    icon: 'error',
                    title: c.message,
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        },
        closeConnectionDialog() {
            this.activeDialog = false;
        },
        /**
         * Reboot Dialog
         * */
        openRebootDialog() {
            this.activeDialog = 'reboot';
            layoutNewComponent("#reboot-dialog");
        },
        closeRebootDialog() {
            this.activeDialog = false;
        },
        doReboot() {
            ipcRenderer.send('shell-cmd', {
                cmd: 'sudo reboot',
                message: 'Reboot initiated',
                errorMessage: 'Unable to reboot.'
            });
            this.activeDialog = false;
        },
        /**
         * Shutdown Dialog
         * */
        openShutdownDialog() {
            this.activeDialog = 'shutdown';
            layoutNewComponent("#shutdown-dialog");
        },
        closeShutdownDialog() {
            this.activeDialog = false;
        },
        doShutdown() {
            ipcRenderer.send('shell-cmd', {
                cmd: 'sudo poweroff',
                message: 'Shutdown initiated',
                errorMessage: 'Unable to shutdown.'
            });
            this.activeDialog = false;
        },
        /**
         * Login Dialog
         * */
        openLoginDialog() {
            this.activeDialog = 'login';
            layoutNewComponent("#login-dialog");
            setTimeout(() => jQuery("#login-entrypoint").focus(), 150);
        },
        closeLoginDialog() {
            this.activeDialog = false;
        },
        async doLogin() {
            event.preventDefault();
            if (!this.un || !this.pw || !this.un.length || !this.pw.length) {
                Swal.fire({
                    position: 'top-end',
                    icon: 'error',
                    title: 'Please enter username and password.',
                    showConfirmButton: false,
                    timer: 2000
                });
                return false;
            }
            this.activeDialog = false;
            if (!this.terminalIntrim || !this.terminalIntrim.ec) {
                Swal.fire({
                    position: 'top-end',
                    icon: 'error',
                    title: 'Pleae connect terminal first.',
                    showConfirmButton: false,
                    timer: 2000
                });
                return false;
            }
            try {
                let resp = await http.get(`/api/v1/terminal/login?mac=${encodeURIComponent(this.mac)}&tid=${encodeURIComponent(this.terminalIntrim._id)}&rid=${encodeURIComponent(this.terminalIntrim.retailer)}&ec=${encodeURIComponent(this.terminalIntrim.ec)}&u=${encodeURIComponent(this.un)}&p=${encodeURIComponent(this.pw)}`);
                console.log(resp);
                if (resp && resp.data && resp.data.success) {
                    if (!resp.data.data.enabled) throw new Error('Terminal is disabled.');
                    if (!resp.data.data.g) throw new Error('Terminal not assigned any game yet.');
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'Logged in.',
                        showConfirmButton: false,
                        timer: 2000
                    });
                    let ec = this.terminalIntrim.ec;
                    this.terminalIntrim = resp.data.data;
                    this.terminalIntrim.ec = ec;
                    this.initGamePlay(this.terminalIntrim);
                } else throw new Error(resp && resp.data && resp.data.error || 'Unable to login.');
            } catch (c) {
                console.log(c);
                Swal.fire({
                    position: 'top-end',
                    icon: 'error',
                    title: c.message,
                    showConfirmButton: false,
                    timer: 2000
                });
            }
            return false;
        },
        getPrintTid() {
            try {
                let last3 = this.terminalIntrim._id.toString().replace(/^.+(...)$/ig, '$1');
                return `${this.terminalIntrim && this.terminalIntrim.retailer && this.terminalIntrim.retailer.username || this.un}-${last3}`
            } catch (c) {
                return '';
            }
        },
        /**
         * Game
         * */
        async loadCredits() {
            try {
                let resp = await http.get(`/api/v1/terminal/points?mac=${encodeURIComponent(this.mac)}&tid=${encodeURIComponent(this.terminalIntrim._id)}&rid=${encodeURIComponent(this.terminalIntrim.retailer)}&ec=${encodeURIComponent(this.terminalIntrim.ec)}`);
                console.log(resp);
                if (resp && resp.data && resp.data.success) {
                    this.gCredits = resp.data.points;
                    if (this.gCredits === 0) this.gCredits = '0';
                }
            } catch (c) {
                console.log('Unable to load...');
            }
        },
        async initGamePlay(terminal) {
            console.log('Init Game Play', terminal);
            this.terminal = terminal;
            this.game = terminal.g;
            window._socket.on(this.game._id, (message) => {
                console.log('Socket Play!', message);
                let op = this.gcanBuy;
                this.gamePlay = message.play;
                this.gcanBuy = message.canBuy;
                this.gfrozen = message.frozen;
                this.gspinner = message.spinner;
                this.gresult = message.result;
                this.ctdn = message.countdown;
                // tdo make better
                this.loadCredits();
                if (this.gcanBuy && !op) {
                    this.ctrN = '';
                    this.startGame();
                }
                let od = this.activeDialog;
                /*if (this.gresult) {
                    this.activeDialog = 'gresult';
                    if (od !== 'gresult') layoutNewComponent("#gresult-dialog");
                }
                else */
                if (this.gspinner || this.gresult) {
                    this.activeDialog = 'gspinner';
                    if (od !== 'gspinner') {
                        layoutNewComponent("#gspinner-dialog");
                        //Start Count
                        this.ctrPid = setInterval(() => {
                            this.ctrN = `YTxx`.replace(/x/ig, () => ~~(Math.random() * 10));
                        }, 200);
                    } else if (this.gresult && this.ctrPid) {
                        clearInterval(this.ctrPid);
                        this.ctrPid = null;
                        this.ctrN = `YT${this.gamePlay.winner}`;
                    }
                }
                else if (this.gfrozen) {
                    this.activeDialog = 'nobuy';
                    if (od !== 'nobuy') layoutNewComponent("#nobuy-dialog");
                }
                else this.activeDialog = null;
            });
            await this.startGame();
            // layout fixes
            layoutNewComponentTree("#game_screen");
            // todo cancel request

        },
        async startGame() {
            // load credits
            await this.loadCredits();
            var date = new Date();
            var invdate = new Date(date.toLocaleString('en-US', {
                timeZone: 'Asia/Kolkata'
            }));
            var diff = date.getTime() - invdate.getTime();
            const addTime = play => {
                if (!play) return play;
                let date = new Date(play.endTime - diff);
                let hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
                let am_pm = date.getHours() >= 12 ? "PM" : "AM";
                hours = hours < 10 ? "0" + hours : hours;
                let minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
                // let seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
                play.time = hours + ":" + minutes /*+ ":"*/ /*+ seconds*/ + " " + am_pm;
                return play;
            };
            // load results
            try {
                let resp = await http.get(`/api/v1/terminal/plays?mac=${encodeURIComponent(this.mac)}&tid=${encodeURIComponent(this.terminalIntrim._id)}&rid=${encodeURIComponent(this.terminalIntrim.retailer)}&ec=${encodeURIComponent(this.terminalIntrim.ec)}&gid=${encodeURIComponent(this.game._id)}`);
                console.log(resp);
                if (resp && resp.data && resp.data.success) {
                    let plays = [];
                    while (resp.data.plays.length) {
                        plays.push({
                            l: addTime(resp.data.plays.shift()),
                            r: addTime(resp.data.plays.shift()),
                            rr: addTime(resp.data.plays.shift())
                        })
                    }
                    this.gPlays = plays;
                }
            } catch (c) {
                console.log('Unable to load plays...');
            }
            // clear all boxes
            this.resetSelectMatrix();
            // set hot keys
            this.bindGameKeys();
        },
        showGameVersion() {
            Swal.fire({
                // position: 'top-end',
                icon: 'success',
                title: "About  Yantra",
                html: `Welcome to Yantra lotto engine. You are running version: <b>${this.version}</b>`,
                showConfirmButton: true
            });
        },
        confirmExit() {
            Swal.fire({
                title: 'Are you sure?',
                text: "This will exit the game and lg you out.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, exit game!'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.exitGame();
                }
            });
        },
        matrixUp() {
            let row = this.currCell.row - 1;
            if (row < 0) row = this.selectMatrix.length;
            this.matrixFocus(row, this.currCell.col);
        },
        matrixDown() {
            let row = this.currCell.row + 1;
            if (row >= this.selectMatrix.length) row = 0;
            this.matrixFocus(row, this.currCell.col);
        },
        matrixLeft() {
            let col = this.currCell.col - 1;
            if (col < 0) col = this.selectMatrix[this.currCell.row].cols.length - 1;
            this.matrixFocus(this.currCell.row, col);
        },
        matrixRight() {
            let col = this.currCell.col + 1;
            if (col >= this.selectMatrix[this.currCell.row].cols.length) col = 0;
            this.matrixFocus(this.currCell.row, col);
        },
        bindMenuKeys() {
            hotkeys('up', (event) => {
                let $mts = jQuery('.mm_btn');
                event.preventDefault();
                console.log('Menu up');
                this.mCurrIdx -= 1;
                $mts.removeClass('mm_btn_hover');
                if (this.mCurrIdx < 0) this.mCurrIdx = $mts.size() - 1;
                console.log(this.mCurrIdx);
                $mts.eq(this.mCurrIdx).addClass('mm_btn_hover');
            });

            hotkeys('down', (event) => {
                event.preventDefault();
                console.log('Menu down');
                let $mts = jQuery('.mm_btn');
                this.mCurrIdx += 1;
                $mts.removeClass('mm_btn_hover');
                if (this.mCurrIdx >= $mts.size()) this.mCurrIdx = 0;
                console.log(this.mCurrIdx);
                $mts.eq(this.mCurrIdx).addClass('mm_btn_hover');
            });

            hotkeys('enter', (event) => {
                event.preventDefault();
                console.log('Menu enter');
                let $mts = jQuery('.mm_btn');
                $mts.eq(this.mCurrIdx).click();
            });

            hotkeys('esc', (event) => {
                event.preventDefault();
                console.log('Menu esc');
                this.activeDialog = false;
            });
        },
        unbindMenuKeys() {
            // let $mts = jQuery('.mm_btn');
            // $mts.hover(() => undefined, () => $mts.removeClass('mm_btn_hover'));
            hotkeys.unbind('up');
            hotkeys.unbind('down');
            hotkeys.unbind('enter');
            hotkeys.unbind('esc');
        },
        bindGameKeys() {
            console.log('Binding keys');
            hotkeys('f7', (event) => {
                // Prevent the default refresh event under WINDOWS system
                event.preventDefault();
                console.log('f7');
                this.showGameVersion();
            });
            hotkeys('f3', (event) => {
                // Prevent the default refresh event under WINDOWS system
                event.preventDefault();
                console.log('f3');
                this.confirmExit();
            });

            hotkeys('f8', (event) => {
                // Prevent the default refresh event under WINDOWS system
                event.preventDefault();
                console.log('f8');
                this.focusRedeem();
            });

            hotkeys('f5', (event) => {
                // Prevent the default refresh event under WINDOWS system
                event.preventDefault();
                console.log('f5');
                this.resetSelectMatrix();
            });

            hotkeys('f4', (event) => {
                // Prevent the default refresh event under WINDOWS system
                event.preventDefault();
                console.log('f4');
                this.purchaseDetails();
            });

            hotkeys('f6', (event) => {
                // Prevent the default refresh event under WINDOWS system
                event.preventDefault();
                console.log('f6');
                this.doPurchase();
            });

            hotkeys('f9', (event) => {
                // Prevent the default refresh event under WINDOWS system
                event.preventDefault();
                console.log('f9');
                this.cancelPurchase();
            });

            hotkeys('f10', (event) => {
                // Prevent the default refresh event under WINDOWS system
                event.preventDefault();
                console.log('f10');
                this.lastRecipt();
            });

            hotkeys('up', (event) => {
                event.preventDefault();
                console.log('up');
                this.matrixUp();
            });

            hotkeys('down', (event) => {
                event.preventDefault();
                console.log('down');
                this.matrixDown();
            });

            hotkeys('left', (event) => {
                event.preventDefault();
                console.log('left');
                this.matrixLeft();
            });

            hotkeys('right', (event) => {
                event.preventDefault();
                console.log('right');
                this.matrixRight();
            });
        },
        inputFocus(e, rdx, cdx, c) {
            this.currCell = {row: rdx, col: cdx};
            // c.val = event.target.value;
            this.highlight = {};
            if (c.special) {
                if (c.allA) {
                    // set full row
                    this.selectMatrix[rdx].cols.forEach(rw => {
                        if (!rw.special) {
                            this.highlight[rw.num] = true;
                        }
                    });
                } else if (c.allB) {
                    // set full col
                    this.selectMatrix.forEach(r => {
                        if (!r.special) {
                            let cl = r.cols[cdx];
                            if (!cl.special) {
                                this.highlight[cl.num] = true;
                            }
                        }
                    });
                } else if (c.allC) {
                    // set full diag
                    for (let cr = (4 + cdx >= 10 ? 9 : 4 + cdx), cc = ((4 + cdx >= 10 ? 4 + cdx - 9 : 0)); cr > -1 && cc < 10; cr--, cc++) {
                        let r = this.selectMatrix[cr];
                        let cl = r.cols[cc];
                        if (!cl.special) {
                            this.highlight[cl.num] = true;
                        }
                    }
                }
            }
        },
        inputKeyDown(event, rdx, cdx, c, noenter) {
            if (!this.gcanBuy) return;
            switch (event.keyCode) {
                case 37:
                    event.preventDefault();
                    this.matrixLeft();
                    break;
                case 38:
                    event.preventDefault();
                    this.matrixUp();
                    break;
                case 39:
                    event.preventDefault();
                    this.matrixRight();
                    break;
                case 40:
                case 13:
                    if (!noenter) {
                        event.preventDefault();
                        this.matrixDown();
                    }
                    break;
                case 114: //f3 exit
                    event.preventDefault();
                    this.confirmExit();
                    break;
                case 118: // f7
                    event.preventDefault();
                    this.showGameVersion();
                    break;
                case 119: // f8
                    event.preventDefault();
                    this.focusRedeem();
                    break;
                case 116:
                    event.preventDefault();
                    this.resetSelectMatrix();
                    break;
                case 117:
                    event.preventDefault();
                    this.doPurchase();
                    break;
                case 120:
                    event.preventDefault();
                    this.cancelPurchase();
                    break;
                case 121:
                    event.preventDefault();
                    this.lastRecipt();
                    break;
                case 115:
                    event.preventDefault();
                    this.purchaseDetails();
                    break;
            }
        },
        inputKeyUp(event, rdx, cdx, c) {
            if (!this.gcanBuy) return;
            switch (event.keyCode) {
                case 37:
                case 38:
                case 39:
                case 40:
                case 13:
                case 114:
                case 118:
                case 119:
                case 116:
                case 115:
                case 120:
                case 121:
                case 117:
                    break;
                default:
                    // c.val = event.target.value;
                    if (c.allA) {
                        // set full row
                        this.selectMatrix[rdx].cols.forEach(rw => {
                            if (!rw.special) {
                                rw.val = (parseInt(c.val, 10) || 0) + (rw.origVal || 0) + (rw.acVal || 0) + (rw.abVal || 0);
                                rw.aaVal = parseInt(c.val, 10) || 0;
                                if (rw.val === 0) rw.val = '';
                                jQuery('.mat_inp_' + rw.row + '_' + rw.col).val(rw.val);
                            }
                        });
                    } else if (c.allB) {
                        // set full col
                        this.selectMatrix.forEach(r => {
                            if (!r.special) {
                                let cl = r.cols[cdx];
                                if (!cl.special) {
                                    cl.val = (parseInt(c.val, 10) || 0) + (cl.origVal || 0) + (cl.aaVal || 0) + (cl.acVal || 0);
                                    cl.abVal = parseInt(c.val, 10) || 0;
                                    if (cl.val === 0) cl.val = '';
                                    jQuery('.mat_inp_' + cl.row + '_' + cl.col).val(cl.val);
                                }
                            }
                        });
                    } else if (c.allC) {
                        // set full diag
                        for (let cr = (4 + cdx >= 10 ? 9 : 4 + cdx), cc = ((4 + cdx >= 10 ? 4 + cdx - 9 : 0)); cr > -1 && cc < 10; cr--, cc++) {
                            let r = this.selectMatrix[cr];
                            let cl = r.cols[cc];
                            if (!cl.special) {
                                cl.val = (parseInt(c.val, 10) || 0) + (cl.origVal || 0) + (cl.aaVal || 0) + (cl.abVal || 0);
                                cl.acVal = parseInt(c.val, 10) || 0;
                                if (cl.val === 0) cl.val = '';
                                jQuery('.mat_inp_' + cl.row + '_' + cl.col).val(cl.val);
                            }
                        }
                    } else {
                        this.selectMatrix[rdx].cols[cdx].origVal = parseInt(c.val, 10);
                    }
            }
        },
        unbindGameKeys() {
            hotkeys.unbind('f3');
            hotkeys.unbind('f7');
            hotkeys.unbind('f8');
            hotkeys.unbind('f9');
            hotkeys.unbind('f5');
            hotkeys.unbind('f4');
            hotkeys.unbind('f6');
            hotkeys.unbind('f10');
            hotkeys.unbind('up');
            hotkeys.unbind('down');
            hotkeys.unbind('left');
            hotkeys.unbind('right');
        },
        async doPurchase() {
            if (!this.gcanBuy) return;
            if(this.purLocked) return;
            this.purLocked = true;
            setTimeout(()=> this.purLocked = false, 700);
            // let p = parseInt(req.param('p'), 10);
            // let v = parseInt(req.param('v'), 10);
            // let bkd = req.param('bkd');
            let p = 0, v = 0, bkd = {}, q = 0;
            this.selectMatrix.forEach(r => {
                r.cols.forEach(c => {
                    if (!c.special && c.val && parseInt(c.val, 10) > 0) {
                        let n = parseInt(c.val, 10);
                        p += n;
                        bkd[c.num] = n;
                        q++;
                    }
                });
            });
            if (!p) return;
            v = p * this.game.pointValue;
            let num = `${'..............'.replace(/./g, () => (~~(Math.random() * 10)).toString(10))}`;
            let code = `${this.terminalIntrim._id.toString().replace(/^.+(...)$/, '$1')}${this.gamePlay._id.toString().replace(/^.+(...)$/, '$1')}${p}${'....'.replace(/./g, () => (~~(Math.random() * 24)).toString(24))}`.toUpperCase();
            try {
                if (p > parseInt(this.gCredits, 10)) return console.log(new Error("Not enough points"));
                ipcRenderer.send('print-recipt', {
                    id: num,
                    code: code,
                    tid: this.getPrintTid(),
                    gameName: this.game.name,
                    gameEndTime: this.gamePlay.endTime,
                    bkd,
                    qty: q,
                    pts: p,
                    gnum: this.gamePlay.code
                });
                let resp = await http.get(`/api/v1/terminal/buy?mac=${encodeURIComponent(this.mac)}&tid=${encodeURIComponent(this.terminalIntrim._id)}&rid=${encodeURIComponent(this.terminalIntrim.retailer)}&ec=${encodeURIComponent(this.terminalIntrim.ec)}&gid=${encodeURIComponent(this.game._id)}&gpid=${encodeURIComponent(this.gamePlay._id)}&p=${p}&v=${v}&bkd=${encodeURIComponent(JSON.stringify(bkd))}&num=${num}&code=${code}`);
                console.log(resp);
                if (resp && resp.data && resp.data.success) {
                    // Swal.fire({
                    //     // position: 'top-end',
                    //     icon: 'success',
                    //     title: "Success",
                    //     html: `Ticket purchased successfully`,
                    //     showConfirmButton: false,
                    //     timer: 1000
                    // });
                    this.resetSelectMatrix(true);
                    this.loadCredits();
                    this.lastPurchase = {
                        id: num,
                        code: code,
                        tid: this.getPrintTid(),
                        gameName: this.game.name,
                        gameEndTime: this.gamePlay.endTime,
                        bkd,
                        qty: q,
                        pts: p,
                        gnum: this.gamePlay.code
                    };
                } else {
                    Swal.fire({
                        // position: 'top-end',
                        icon: 'error',
                        title: "Error",
                        html: `Ticket can not be purchased. ` + resp.data.error,
                        showConfirmButton: false,
                        timer: 1000
                    });
                    ipcRenderer.send('print-recipt', {
                        id: num,
                        code: 'CANCEL',
                        tid: this.getPrintTid(),
                        gameName: this.game.name,
                        gameEndTime: this.gamePlay.endTime,
                        bkd,
                        qty: q,
                        pts: p,
                        gnum: this.gamePlay.code
                    });
                }
            } catch (c) {
                console.log('Unable to buy...');
                Swal.fire({
                    // position: 'top-end',
                    icon: 'error',
                    title: "Error",
                    html: `Ticket can not be purchased. ` + c.message,
                    showConfirmButton: true
                });
                ipcRenderer.send('print-recipt', {
                    id: num,
                    code: 'CANCEL',
                    tid: this.getPrintTid(),
                    gameName: this.game.name,
                    gameEndTime: this.gamePlay.endTime,
                    bkd,
                    qty: q,
                    pts: p,
                    gnum: this.gamePlay.code
                });
            }
        },
        cancelPurchase() {
            if (!this.gcanBuy) return;
            const self = this;
            Swal.fire({
                title: 'Scan To Cancel Ticket',
                input: 'text',
                inputAttributes: {
                    autocapitalize: 'off'
                },
                showCancelButton: true,
                confirmButtonText: 'Cancel Ticket',
                showLoaderOnConfirm: true,
                preConfirm: (code) => {
                    return new Promise(async (res, rej) => {
                        try {
                            let resp = await http.get(`/api/v1/terminal/cancel?mac=${encodeURIComponent(this.mac)}&tid=${encodeURIComponent(this.terminalIntrim._id)}&rid=${encodeURIComponent(this.terminalIntrim.retailer)}&ec=${encodeURIComponent(this.terminalIntrim.ec)}&cid=${code}`);
                            console.log(resp);
                            if (resp && resp.data && resp.data.success) {
                                ipcRenderer.send('print-can-recipt', {
                                    id: resp.data.purchase.num,
                                    code: resp.data.purchase.code,
                                    tid: self.getPrintTid()
                                });
                                // ipcRenderer.send('print-can-recipt', {
                                //     id: resp.data.purchase.num,
                                //     code: resp.data.purchase.code,
                                //     tid: resp.data.tid
                                // });
                                this.loadCredits();
                                res();
                            } else {
                                rej(new Error(resp.data.error));
                            }
                        } catch (c) {
                            console.log('Unable to cancel...');
                            rej(c);
                        }
                    })
                        .catch(error => {
                            Swal.showValidationMessage(
                                `Request failed: ${error}`
                            )
                        });
                },
                allowOutsideClick: () => !Swal.isLoading()
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        // position: 'top-end',
                        icon: 'success',
                        title: "Success",
                        html: `Ticket cancelled successfully`,
                        showConfirmButton: false,
                        timer: 1000
                    });
                }
            })
        },
        lastRecipt() {
            if (!this.gcanBuy) return;
            if (!this.lastPurchase) return;
            ipcRenderer.send('print-recipt', this.lastPurchase);
        },
        async purchaseDetails() {
            try {
                let resp = await http.get(`/api/v1/terminal/summary?mac=${encodeURIComponent(this.mac)}&tid=${encodeURIComponent(this.terminalIntrim._id)}&rid=${encodeURIComponent(this.terminalIntrim.retailer)}&ec=${encodeURIComponent(this.terminalIntrim.ec)}`);
                console.log(resp);
                if (resp && resp.data && resp.data.success) {
                    window.__sumIdx = 0;
                    Swal.fire({
                        // position: 'top-end',
                        icon: 'success',
                        title: "POS Report",
                        html: `
                        <table style="width:100%">
                        <tr>
                            <td style="width: 100px;">
                                <button onclick="window.__sumIdx = 0;$('.sum_btn').removeClass('sbactive');$('#sum_btn_0').addClass('sbactive');$('.sum_td').hide();$('#sum_td_0').show();" class="sum_btn sbactive" id="sum_btn_0">${resp.data.feed[0].dt}</button><br>
                                <button onclick="window.__sumIdx = 1;$('.sum_btn').removeClass('sbactive');$('#sum_btn_1').addClass('sbactive');$('.sum_td').hide();$('#sum_td_1').show();" class="sum_btn" id="sum_btn_1">${resp.data.feed[1].dt}</button><br>
                                <button onclick="window.__sumIdx = 2;$('.sum_btn').removeClass('sbactive');$('#sum_btn_2').addClass('sbactive');$('.sum_td').hide();$('#sum_td_2').show();" class="sum_btn" id="sum_btn_2">${resp.data.feed[2].dt}</button><br>
                                <button onclick="window.__sumIdx = 3;$('.sum_btn').removeClass('sbactive');$('#sum_btn_3').addClass('sbactive');$('.sum_td').hide();$('#sum_td_3').show();" class="sum_btn" id="sum_btn_3">${resp.data.feed[3].dt}</button><br>
                                <button onclick="window.__sumIdx = 4;$('.sum_btn').removeClass('sbactive');$('#sum_btn_4').addClass('sbactive');$('.sum_td').hide();$('#sum_td_4').show();" class="sum_btn" id="sum_btn_4">${resp.data.feed[4].dt}</button><br>
                                <button onclick="window.__sumIdx = 5;$('.sum_btn').removeClass('sbactive');$('#sum_btn_5').addClass('sbactive');$('.sum_td').hide();$('#sum_td_5').show();" class="sum_btn" id="sum_btn_5">${resp.data.feed[5].dt}</button><br>
                                <button onclick="window.__sumIdx = 6;$('.sum_btn').removeClass('sbactive');$('#sum_btn_6').addClass('sbactive');$('.sum_td').hide();$('#sum_td_6').show();" class="sum_btn" id="sum_btn_6">${resp.data.feed[6].dt}</button>
                            </td>
                            <td class="sum_td" id="sum_td_0" style="display: block">
                                <hr>
                                <b>Date</b>: ${resp.data.feed[0].dt}<br>
                                <b>Total Tickets</b>: ${resp.data.feed[0].c}<br>
                                <b>M.Pts</b>: ${(resp.data.feed[0].p).toFixed(2)}<br>
                                <b>F.Pts</b>: ${(resp.data.feed[0].rp).toFixed(2)}<br>
                                <b>G.P</b>: ${(resp.data.feed[0].cm).toFixed(2)}<br>
                                <b>Bal</b>: ${(resp.data.feed[0].bal).toFixed(2)}<br>
                                <b>Cancel</b>: ${(resp.data.feed[0].can).toFixed(2)}<br>
                                <b>Total Pts Coll</b>: ${(resp.data.feed[0].bal - resp.data.feed[0].can).toFixed(2)}<br>
                                <hr>
                            </td>
                            <td class="sum_td" id="sum_td_1" style="display: none">
                                <hr>
                                <b>Date</b>: ${resp.data.feed[1].dt}<br>
                                <b>Total Tickets</b>: ${resp.data.feed[1].c}<br>
                                <b>M.Pts</b>: ${(resp.data.feed[1].p).toFixed(2)}<br>
                                <b>F.Pts</b>: ${(resp.data.feed[1].rp).toFixed(2)}<br>
                                <b>G.P</b>: ${(resp.data.feed[1].cm).toFixed(2)}<br>
                                <b>Bal</b>: ${(resp.data.feed[1].bal).toFixed(2)}<br>
                                <b>Cancel</b>: ${(resp.data.feed[1].can).toFixed(2)}<br>
                                <b>Total Pts Coll</b>: ${(resp.data.feed[1].bal - resp.data.feed[1].can).toFixed(2)}<br>
                                <hr>
                            </td>
                            <td class="sum_td" id="sum_td_2" style="display: none">
                                <hr>
                                <b>Date</b>: ${resp.data.feed[2].dt}<br>
                                <b>Total Tickets</b>: ${resp.data.feed[2].c}<br>
                                <b>M.Pts</b>: ${(resp.data.feed[2].p).toFixed(2)}<br>
                                <b>F.Pts</b>: ${(resp.data.feed[2].rp).toFixed(2)}<br>
                                <b>G.P</b>: ${(resp.data.feed[2].cm).toFixed(2)}<br>
                                <b>Bal</b>: ${(resp.data.feed[2].bal).toFixed(2)}<br>
                                <b>Cancel</b>: ${(resp.data.feed[2].can).toFixed(2)}<br>
                                <b>Total Pts Coll</b>: ${(resp.data.feed[2].bal - resp.data.feed[2].can).toFixed(2)}<br>
                                <hr>
                            </td>
                            <td class="sum_td" id="sum_td_3" style="display: none">
                                <hr>
                                <b>Date</b>: ${resp.data.feed[3].dt}<br>
                                <b>Total Tickets</b>: ${resp.data.feed[3].c}<br>
                                <b>M.Pts</b>: ${(resp.data.feed[3].p).toFixed(2)}<br>
                                <b>F.Pts</b>: ${(resp.data.feed[3].rp).toFixed(2)}<br>
                                <b>G.P</b>: ${(resp.data.feed[3].cm).toFixed(2)}<br>
                                <b>Bal</b>: ${(resp.data.feed[3].bal).toFixed(2)}<br>
                                <b>Cancel</b>: ${(resp.data.feed[3].can).toFixed(2)}<br>
                                <b>Total Pts Coll</b>: ${(resp.data.feed[3].bal - resp.data.feed[3].can).toFixed(2)}<br>
                                <hr>
                            </td>
                            <td class="sum_td" id="sum_td_4" style="display: none">
                                <hr>
                                <b>Date</b>: ${resp.data.feed[4].dt}<br>
                                <b>Total Tickets</b>: ${resp.data.feed[4].c}<br>
                                <b>M.Pts</b>: ${(resp.data.feed[4].p).toFixed(2)}<br>
                                <b>F.Pts</b>: ${(resp.data.feed[4].rp).toFixed(2)}<br>
                                <b>G.P</b>: ${(resp.data.feed[4].cm).toFixed(2)}<br>
                                <b>Bal</b>: ${(resp.data.feed[4].bal).toFixed(2)}<br>
                                <b>Cancel</b>: ${(resp.data.feed[4].can).toFixed(2)}<br>
                                <b>Total Pts Coll</b>: ${(resp.data.feed[4].bal - resp.data.feed[4].can).toFixed(2)}<br>
                                <hr>
                            </td>
                            <td class="sum_td" id="sum_td_5" style="display: none">
                                <hr>
                                <b>Date</b>: ${resp.data.feed[5].dt}<br>
                                <b>Total Tickets</b>: ${resp.data.feed[5].c}<br>
                                <b>M.Pts</b>: ${(resp.data.feed[5].p).toFixed(2)}<br>
                                <b>F.Pts</b>: ${(resp.data.feed[5].rp).toFixed(2)}<br>
                                <b>G.P</b>: ${(resp.data.feed[5].cm).toFixed(2)}<br>
                                <b>Bal</b>: ${(resp.data.feed[5].bal).toFixed(2)}<br>
                                <b>Cancel</b>: ${(resp.data.feed[5].can).toFixed(2)}<br>
                                <b>Total Pts Coll</b>: ${(resp.data.feed[5].bal - resp.data.feed[5].can).toFixed(2)}<br>
                                <hr>
                            </td>
                            <td class="sum_td" id="sum_td_6" style="display: none">
                                <hr>
                                <b>Date</b>: ${resp.data.feed[6].dt}<br>
                                <b>Total Tickets</b>: ${resp.data.feed[6].c}<br>
                                <b>M.Pts</b>: ${(resp.data.feed[6].p).toFixed(2)}<br>
                                <b>F.Pts</b>: ${(resp.data.feed[6].rp).toFixed(2)}<br>
                                <b>G.P</b>: ${(resp.data.feed[6].cm).toFixed(2)}<br>
                                <b>Bal</b>: ${(resp.data.feed[6].bal).toFixed(2)}<br>
                                <b>Cancel</b>: ${(resp.data.feed[6].can).toFixed(2)}<br>
                                <b>Total Pts Coll</b>: ${(resp.data.feed[6].bal - resp.data.feed[6].can).toFixed(2)}<br>
                                <hr>
                            </td>
                        </tr>
                        </table>
                        `,
                        showConfirmButton: true,
                        showCancelButton: true,
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            ipcRenderer.send('print-summary', {
                                dt: resp.data.feed[window.__sumIdx].dt,
                                c: resp.data.feed[window.__sumIdx].c,
                                p: resp.data.feed[window.__sumIdx].p,
                                wp: resp.data.feed[window.__sumIdx].wp,
                                rp: resp.data.feed[window.__sumIdx].rp,
                                bal: resp.data.feed[window.__sumIdx].bal,
                                cm: resp.data.feed[window.__sumIdx].cm,
                                cp: resp.data.feed[window.__sumIdx].cp,
                                can: resp.data.feed[window.__sumIdx].can,
                                tid: this.getPrintTid()
                            });
                        }
                    });
                } else {
                    Swal.fire({
                        // position: 'top-end',
                        icon: 'error',
                        title: "Error",
                        html: `Server Error`,
                        showConfirmButton: false,
                        timer: 1000
                    });
                }
            } catch (c) {
                console.log(c);
                Swal.fire({
                    // position: 'top-end',
                    icon: 'error',
                    title: "Error",
                    html: `Server Error`,
                    showConfirmButton: true
                });
            }
        },
        matrixFocus(row, col) {
            setTimeout(() => jQuery(`.mat_inp_${row}_${col}`).focus().select());
            this.currCell = {row, col};
        },
        exitGame() {
            window._socket.off(this.game._id);
            this.unbindGameKeys();
            this.game = null;
            this.gamePlay = null;
            this.terminal = null;
            this.bindMenuKeys();
            // this.terminalIntrim = null;
        },
        focusRedeem() {
            if (!this.gcanBuy) return;
            jQuery('#redeem_input').focus().val('');
        },
        async doRedeem() {
            event.preventDefault();
            if (!this.gcanBuy) return;
            let rv = jQuery('#redeem_input').val();
            if (!rv || !rv.length) return false;
            console.log('Redeeming', rv);
            // let cid = req.param('cid');
            // rp, rwp, rwv, bkd, purchase
            const self = this;
            try {
                let resp = await http.get(`/api/v1/terminal/redeem?mac=${encodeURIComponent(this.mac)}&tid=${encodeURIComponent(this.terminalIntrim._id)}&rid=${encodeURIComponent(this.terminalIntrim.retailer)}&ec=${encodeURIComponent(this.terminalIntrim.ec)}&cid=${rv}&mode=chk`);
                console.log(resp);
                if (resp && resp.data && resp.data.success) {
                    let wNum = resp.data.winner;
                    Swal.fire({
                        title: 'Winner! Confirm Claim!',
                        html: `Congratulations! You win <b>${resp.data.rwp}</b> points of total value <b style="color: green;font-size: 1.2em">${resp.data.rwv}</b>. Wining number: <b>${resp.data.winner}</b>.`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, claim reward!'
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            let resp = await http.get(`/api/v1/terminal/redeem?mac=${encodeURIComponent(this.mac)}&tid=${encodeURIComponent(this.terminalIntrim._id)}&rid=${encodeURIComponent(this.terminalIntrim.retailer)}&ec=${encodeURIComponent(this.terminalIntrim.ec)}&cid=${rv}&mode=pur`);
                            console.log(resp);
                            if (resp && resp.data && resp.data.success) {
                                Swal.fire({
                                    // position: 'top-end',
                                    icon: 'success',
                                    title: "Success",
                                    html: `Ticket redeemed successfully`,
                                    showConfirmButton: false,
                                    timer: 1000
                                });
                                this.loadCredits();
                                ipcRenderer.send('print-red-recipt', {
                                    id: resp.data.purchase.num,
                                    code: resp.data.purchase.code,
                                    rwv: resp.data.rwv,
                                    rwp: resp.data.rwp,
                                    rp: resp.data.rp,
                                    tid: self.getPrintTid(),
                                    dNum: resp.data.dNum,
                                    wNum: wNum
                                });
                                // ipcRenderer.send('print-red-recipt', {
                                //     id: resp.data.purchase.num,
                                //     code: resp.data.purchase.code,
                                //     rwv: resp.data.rwv,
                                //     rwp: resp.data.rwp,
                                //     rp: resp.data.rp,
                                //     tid: resp.data.tid
                                // });
                            } else {
                                Swal.fire({
                                    // position: 'top-end',
                                    icon: 'error',
                                    title: "Error",
                                    html: `Ticket can not be claimed. ` + resp.data.error,
                                    showConfirmButton: false,
                                    timer: 1000
                                });
                            }
                        }
                        jQuery('#redeem_input').val('');
                        this.matrixFocus(this.currCell.row || 5, this.currCell.col || 5);
                    });

                } else {
                    Swal.fire({
                        // position: 'top-end',
                        icon: 'info',
                        title: resp.data.subCode || "Better Luck Next Time",
                        html: resp.data.error,
                        showConfirmButton: false,
                        timer: 1000
                    });
                    jQuery('#redeem_input').val('');
                    this.matrixFocus(this.currCell.row || 5, this.currCell.col || 5);
                }
            } catch (c) {
                console.log('Unable to claim...');
                Swal.fire({
                    // position: 'top-end',
                    icon: 'error',
                    title: "Error",
                    html: `Ticket can not be claimed. ` + c.message,
                    showConfirmButton: false,
                    timer: 1750
                });
                jQuery('#redeem_input').val('');
                this.matrixFocus(this.currCell.row || 5, this.currCell.col || 5);
            }
            return false;
        },
        sumPoints() {
            if (!this.terminal || !this.game) return 0;
            try {
                return this.selectMatrix.reduce((p, c) => {
                    return p + c.cols.reduce((pc, cc) => {
                        return pc + (cc.special ? 0 : (parseInt(cc.val || '0', 10) || 0));
                    }, 0);
                }, 0);
            } catch (c) {
                console.log(this.selectMatrix);
                console.log(c);
            }
        },
        sumValue() {
            if (!this.terminal || !this.game) return 0;
            return this.sumPoints() * this.game.pointValue;
        },
        resetSelectMatrix(noMoveCursor) {
            this.selectMatrix = [];
            for (let j = 0; j < 10; j++) {
                let jth = [];
                for (let k = 0; k < 10; k++) {
                    jth.push({
                        row: j,
                        col: k,
                        num: (j * 10) + k,
                        label: `YT${(j * 10) + k}`,
                        selected: false,
                        special: false,
                        val: ''
                    });

                }
                jth.push({
                    row: j,
                    col: 0,
                    num: 0,
                    label: `ALL A`,
                    selected: false,
                    special: true,
                    allA: true,
                    val: ''
                });
                this.selectMatrix.push({row: j, cols: jth, special: false});
            }
            let sb = [],
                sc = [];
            for (let l = 0; l < 10; l++) {
                sb.push({
                    row: 10,
                    col: l,
                    num: l + 1,
                    label: `ALL B`,
                    selected: false,
                    special: true,
                    allB: true,
                    val: ''
                });
                sc.push({
                    row: 11,
                    col: l,
                    num: l + 1,
                    label: `ALL C`,
                    selected: false,
                    special: true,
                    allC: true,
                    val: ''
                });
            }
            this.selectMatrix.push({row: 10, cols: sb, special: true});
            this.selectMatrix.push({row: 11, cols: sc, special: true});
            jQuery('.mat_inp').val('');
            if (!noMoveCursor) setTimeout(() => this.matrixFocus(5, 5), 500);
        }
    }
});
