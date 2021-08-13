/*
 AXLE ENGINE (jQuery Plugin)
 * By Kushal Likhi
 * (c) kushal likhi
 * */
// window.jQuery = window.$;

var axle = {
    alertError: true,
    logError: true,
    plugin: {
        jquery: {
            register: function () {
                return function ($) {
                    $.fn.axle = function (callback) {
                        var $el = this;
                        axle.resizeMonitor.addListener(this.selector, function (fn) {
                            fn();
                            return fn;
                        }(function () {
                            $el.find("*").each(function () {
                                axle.engine.apply($(this));
                            });
                            try {
                                callback();
                            } catch (c) {
                                axle.reportError(c);
                            }
                        }));
                        return this;
                    }
                }(jQuery);
            }
        }
    },
    reportError: function (error) {
        try {
            if (axle.logError) {
                console.log("[AXLE ERROR] " + error);
                console.log(error);
                window.yo = error;
            }
        } catch (c) {
        }
        if (axle.alertError) {
            alert("[AXLE ERROR] " + error);
        }
    },
    toInt: function (str) {
        return parseInt(str.replace(/px/ig, ''), 10);
    },
    apply: function (prop, val, $el) {
        $el.css({
            position: 'absolute',
            zIndex: parseInt($el.css("zIndex"), 10) > 1 ? $el.css("zIndex") : "1"
        });
        $el.css(prop, val);
    },
    computeElasticFontSize: function (directive, $el) {
        var containerHeight = $el.height(),
            containerWidth = $el.width();
        var dtokens = directive.split(',');
        var dh = dtokens.shift(),
            dw = dtokens.shift(),
            df = dtokens.shift();
        var unit = df.replace(/\d|\./g, '');
        df = df.replace(/[^\d\.]/i, '');
        if (!unit || unit.length == 0) unit = 'px';
        if (containerHeight && containerWidth && dh && dh.length && dw && dw.length && df && df.length && unit && unit.length) {
            var newSize = 0;
            dh = parseFloat(dh);
            dw = parseFloat(dw);
            df = parseFloat(df);
            var deltaWidth = containerWidth - dw;
            var deltaHeight = containerHeight - dh;
            if (deltaWidth < deltaHeight) {
                // width
                newSize = (df / dw) * (dw + deltaWidth);
            } else {
                // height
                newSize = (df / dh) * (dh + deltaHeight);
            }
            newSize = newSize + unit;
            $el.attr('data-axle-elastic-font-debug', JSON.stringify({
                containerHeight,
                containerWidth,
                dh,
                dw,
                df,
                unit,
                newSize,
                deltaWidth,
                deltaHeight
            }));
            return newSize;
        } else return undefined;
    },
    parse: function (expression) {
        // w10% + h10% + {#ss}h20% + {#ss}w20% + {#ss}t20% + {#ss}l20% + {#ss}r20% + {#ss}b20% + {#ss}h + {#ss}w + {#ss}t + {#ss}l + {#ss}r + {#ss}b + w + h
        expression = expression.replace(/{([^}]+?)}(w|h|t|l|r|b)([\d\.]+)%/ig, function (a, b, c, d) {
            switch (c.toString().toLowerCase()) {
                case 'h':
                    return "(((window.jQuery('" + b + "').height())/100) * " + d + " )";
                    break;
                case 'w':
                    return "(((window.jQuery('" + b + "').width())/100) * " + d + " )";
                    break;
                case 't':
                    return "((window.axle.toInt(window.jQuery('" + b + "').css('top'))/100) * " + d + " )";
                    break;
                case 'l':
                    return "((window.axle.toInt(window.jQuery('" + b + "').css('left'))/100) * " + d + " )";
                    break;
                case 'b':
                    return "((window.axle.toInt(window.jQuery('" + b + "').css('bottom'))/100) * " + d + " )";
                    break;
                case 'r':
                    return "((window.axle.toInt(window.jQuery('" + b + "').css('right'))/100) * " + d + " )";
                    break;
            }
        });
        expression = expression.replace(/{([^}]+?)}(w|h|t|l|r|b)/ig, function (a, b, c) {
            switch (c.toString().toLowerCase()) {
                case 'h':
                    return "window.jQuery('" + b + "').height()";
                    break;
                case 'w':
                    return "window.jQuery('" + b + "').width()";
                    break;
                case 't':
                    return "window.axle.toInt(window.jQuery('" + b + "').css('top'))";
                    break;
                case 'l':
                    return "window.axle.toInt(window.jQuery('" + b + "').css('left'))";
                    break;
                case 'b':
                    return "window.axle.toInt(window.jQuery('" + b + "').css('bottom'))";
                    break;
                case 'r':
                    return "window.axle.toInt(window.jQuery('" + b + "').css('right'))";
                    break;
            }
        });
        expression = expression.replace(/(w|h)([\d\.]*)%/ig, function (a, b, c) {
            switch (b.toString().toLowerCase()) {
                case 'h':
                    return "((window.axle.availableDimensions.height/100) * " + c + " )";
                    break;
                case 'w':
                    return "((window.axle.availableDimensions.width/100) * " + c + " )";
                    break;
            }
        });
        expression = expression.replace(/ (w|h) /ig, function (a, b) {
            switch (b.toString().toLowerCase()) {
                case 'h':
                    return " window.axle.availableDimensions.height ";
                    break;
                case 'w':
                    return " window.axle.availableDimensions.width ";
                    break;
            }
        });
        expression = expression.replace(/ (w|h)$/ig, function (a, b) {
            switch (b.toString().toLowerCase()) {
                case 'h':
                    return " window.axle.availableDimensions.height ";
                    break;
                case 'w':
                    return " window.axle.availableDimensions.width ";
                    break;
            }
        });
        return expression;
    },
    engine: function () {
        if (this.attr("data-axle-height")) {
            axle.apply('height', eval(axle.parse(this.attr("data-axle-height"))) + "px", this);
        }
        if (this.attr("data-axle-width")) {
            axle.apply('width', eval(axle.parse(this.attr("data-axle-width"))) + "px", this);
        }
        if (this.attr("data-axle-top")) {
            axle.apply('top', eval(axle.parse(this.attr("data-axle-top"))) + "px", this);
        }
        if (this.attr("data-axle-left")) {
            axle.apply('left', eval(axle.parse(this.attr("data-axle-left"))) + "px", this);
        }
        if (this.attr("data-axle-right")) {
            axle.apply('right', eval(axle.parse(this.attr("data-axle-right"))) + "px", this);
        }
        if (this.attr("data-axle-bottom")) {
            axle.apply('bottom', eval(axle.parse(this.attr("data-axle-bottom"))) + "px", this);
        }
        if (this.attr("data-axle-layer")) {
            axle.apply('zIndex', eval(axle.parse(this.attr("data-axle-layer"))), this);
        }
        if (this.attr("data-axle-line-height")) {
            axle.apply('lineHeight', eval(axle.parse(this.attr("data-axle-line-height"))) + "px", this);
        }
        if (this.attr("data-axle-font-hwf")) {
            var newSize = axle.computeElasticFontSize(this.attr("data-axle-font-hwf"), this);
            if (newSize) axle.apply('fontSize', newSize, this);
        }
        if (this.attr("onAxleLayout")) {
            var random = parseInt(Math.random() * 1000, 10);
            eval("window.axleCallbackInline" + random + " = function(){" + this.attr("onAxleLayout") + "}");
            window["axleCallbackInline" + random].apply(this);
        }
    },
    processAxleFiles: function () {
        try {
            jQuery.ajaxSetup({async: false});
            jQuery("link[rel='axle']").each(function () {
                var file = "";
                $.ajax({
                    url: jQuery(this).attr("href"),
                    type: "GET",
                    dataType: "text",
                    async: false,
                    success: function (data) {
                        file = data;
                    }
                });
                file = file.replace(/\{\{/g, "###open###").replace(/\}\}/g, "###close###");
                file.replace(/([^\{]+)\{([^\{]*)\}/g, function (full, selector, content) {
                    var pSelector = jQuery.trim(selector).split(",");
                    var pContent = [];
                    axle.each(jQuery.trim(content).split(";"), function () {
                        pContent.push(jQuery.trim(this));
                    });
                    axle.each(pSelector, function () {
                        axle.loadDataToElement.apply(jQuery(jQuery.trim(this)), [pContent]);
                    });
                });
            });
            jQuery.ajaxSetup({async: true});
        } catch (c) {
            axle.reportError(c);
            jQuery.ajaxSetup({async: true});
        } finally {
            jQuery.ajaxSetup({async: true});
        }
    },
    loadDataToElement: function (props) {
        var mapper = new axle.PropertyFileMapper(this);
        axle.each(props, function () {
            mapper.setProperty(this);
            mapper.execute();
        });
    },
    PropertyFileMapper: function (element) {
        var el = this;
        this.setProperty = function (property) {
            var tokens = [];
            property.replace(/([a-zA-Z\-]+):(.+)/, function (all, key, val) {
                tokens = [key, val];
            });
            try {
                el.key = jQuery.trim(tokens[0]);
            } catch (c) {
                axle.reportError(c);
                el.key = null
            }
            try {
                el.value = jQuery.trim(tokens[1]).replace(/###open###/g, "{").replace(/###close###/g, "}");
            } catch (c) {
                axle.reportError(c);
                el.value = null
            }
        };
        var checkIfAxleProperty = function (prop) {
            return prop.toString().toLowerCase().replace(/(height)|(width)|(top)|(left)|(right)|(bottom)|(layer)|(font-hwf)|(line-height)/, "") == "";
        };
        this.execute = function () {
//           console.log(element.selector + " : key->" + el.key + ", val->" + el.value);
            try {
                if (checkIfAxleProperty(el.key)) {
                    var attr = "data-axle-" + el.key;
                    if (!element.attr(attr)) {
                        element.attr(attr, el.value);
                    }
                } else {
                    element.css(el.key, el.value);
                }
            } catch (c) {
                axle.reportError(c);
            }
        };
    },
    ScreenAreaProvider: function () {
        var browser = new Object();
        browser.height = 0;
        browser.width = 0;
        var obj = this;
        var $el = function () {
            var e = jQuery("meta[name='axleDefaultViewPort']");
            if (e.size() > 0) {
                return jQuery(e.attr("content"));
            } else {
                return jQuery(window);
            }
        }();
        this.findCurrentWindowSize = function () {
            browser.width = $el.width();
            browser.height = $el.height();
            obj.availableHeight = browser.height;
            obj.availableWidth = browser.width;
            obj.availableScreenSize = browser;
            return obj;
        }
    },
    resizeMonitor: {
        handlers: {},
        screenAreaProvider: {},
        previousSize: {},
        newSize: {},
        addListener: function (id, handler) {
            axle.resizeMonitor.handlers[id] = handler;
        },
        removeListener: function (id) {
            delete axle.resizeMonitor.handlers[id];
        },
        monitor: function () {
            axle.resizeMonitor.newSize = axle.resizeMonitor.cloneDimensions(axle.resizeMonitor.screenAreaProvider.findCurrentWindowSize().availableScreenSize);
            axle.availableDimensions = {
                height: axle.resizeMonitor.newSize.height,
                width: axle.resizeMonitor.newSize.width
            };
            if ((axle.resizeMonitor.previousSize.height != axle.resizeMonitor.newSize.height) || (axle.resizeMonitor.previousSize.width != axle.resizeMonitor.newSize.width)) {
                var newDim = axle.resizeMonitor.cloneDimensions(axle.resizeMonitor.newSize);
                axle.resizeMonitor.executeHandlers(newDim.height, newDim.width);
            }
            axle.resizeMonitor.previousSize = axle.resizeMonitor.cloneDimensions(axle.resizeMonitor.newSize);
        },
        executeHandlers: function (height, width) {
            for (var key in axle.resizeMonitor.handlers) {
                try {
                    axle.resizeMonitor.handlers[key](height, width);
                } catch (ex) {
                    axle.reportError(ex);
                }
            }
        },
        cloneDimensions: function (obj) {
            return {
                height: obj.height,
                width: obj.width
            }
        },
        start: function () {
            axle.resizeMonitor.previousSize = axle.resizeMonitor.cloneDimensions(axle.resizeMonitor.screenAreaProvider.findCurrentWindowSize().availableScreenSize);
            axle.resizeMonitor.monitor();
            setInterval("axle.resizeMonitor.monitor()", 100);
            return axle.resizeMonitor;
        },
        init: function () {
            axle.resizeMonitor.screenAreaProvider = new axle.ScreenAreaProvider();
            return axle.resizeMonitor.start();
        }
    },
    each: function (obj, handler) {
        for (var idx in obj) {
            if (obj[idx] && typeof(obj[idx]) != 'function') {
                handler.apply(obj[idx]);
            }
        }
    },
    loaded: function () {
        try {
            if (window["onAxleLayout"])
                window["onAxleLayout"].apply(jQuery("body"));
        } catch (c) {
            axle.reportError(c);
        }
    },
    init: new function () {
        jQuery(document).ready(
            function () {
                axle.constructor();
            }
        );
    },
    constructor: function () {
        axle.resizeMonitor.init();
        axle.plugin.jquery.register();
        axle.processAxleFiles();
        jQuery("body").axle(axle.loaded);
    }
};
