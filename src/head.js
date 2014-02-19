(function() {
    if (logFlags.dom && !console.group) {
        console.group = console.log;
        console.groupCollapsed = console.groupEnd = function() {};
    }