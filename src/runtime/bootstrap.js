if (!window.WebComponents) {
    throw 'Bosonic runtime needs the WebComponents polyfills to be loaded first.';
}

if (!window.Bosonic) {
    window.Bosonic = {};
}