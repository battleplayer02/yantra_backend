/**
 * file for Jquery bidings, non vue
 * */

/**
 * Loader dynamics
 * wait for vue to load and axle to load
 * */
window.vueLoaded = function () {
    console.log('Vue is loaded!');
    window.__vue_loaded = true;
};
window.onAxleLayout = function () {
    console.log('Axle is loaded!');
    window.__axle_loaded = true;
};
const TIME_POLL_LOADED = 1000;

function pollToLoad() {
    console.log('Polling check for loaded', window.__vue_loaded, window.__axle_loaded);
    if (window.__vue_loaded && window.__axle_loaded) {
        app_loaded();
    } else {
        setTimeout(pollToLoad, TIME_POLL_LOADED);
    }
}

setTimeout(pollToLoad, TIME_POLL_LOADED);

window.layoutNewComponent = function (selector) {
    console.log("layouting on demand", selector);
    var $el = jQuery(selector);
    $el.css('visibility', 'hidden');
    setTimeout((() => {
        var $el = jQuery(selector);
        axle.engine.apply($el);
        $el.css('visibility', 'visible');
    }), 50);
};

window.layoutNewComponentTree = function (selector) {
    console.log("layouting tree on demand", selector);
    var $el = jQuery(selector);
    $el.css('visibility', 'hidden');
    setTimeout((() => {
        var $el = jQuery(selector);
        $el.find("*").each(function () {
            axle.engine.apply($(this));
        });
        $el.css('visibility', 'visible');
    }), 50);
};

/**
 * Do everything here, is called once app is loaded fully.
 * */
function app_loaded() {
    console.log('Loaded fully...');
    // hide loader...
    jQuery("#splash").hide();
    // set version info again
    layoutNewComponent("#version-info");
}

