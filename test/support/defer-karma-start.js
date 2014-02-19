// defer start of tests until after WebComponentsReady event
if (window.__karma__) {
    window.__karma__.loaded = function() {
        window.addEventListener('WebComponentsReady', function() {
            window.__karma__.start();
        });
    };
}