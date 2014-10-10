function start() {
    this.tick();
    this._interval = window.setInterval(this.tick.bind(this), 1000);
}
function stop() {
    window.clearInterval(this._interval);
}
function fmt(n) {
    return (n < 10 ? '0' : '') + n;
}
var __bosonic__template__tick_tock_clock__ = function () {
        var df0 = document.createDocumentFragment();
        var el0 = document.createElement('span');
        el0.setAttribute('id', 'hh');
        df0.appendChild(el0);
        var el0 = document.createElement('span');
        el0.setAttribute('id', 'sep');
        el0.appendChild(document.createTextNode(':'));
        df0.appendChild(el0);
        var el0 = document.createElement('span');
        el0.setAttribute('id', 'mm');
        df0.appendChild(el0);
        return { content: df0 };
    }();
window.TickTockClock = document.registerElement('tick-tock-clock', {
    prototype: Object.create(HTMLElement.prototype, {
        createdCallback: {
            enumerable: true,
            value: function () {
                this.createShadowRoot();
                this.shadowRoot.appendChild(document.importNode(__bosonic__template__tick_tock_clock__.content, true));
                if (this.parentElement) {
                    start.call(this);
                }
            }
        },
        attachedCallback: {
            enumerable: true,
            value: start
        },
        detachedCallback: {
            enumerable: true,
            value: stop
        },
        tick: {
            enumerable: true,
            value: function () {
                var now = new Date();
                this.shadowRoot.querySelector('#hh').textContent = fmt(now.getHours());
                this.shadowRoot.querySelector('#sep').style.visibility = now.getSeconds() % 2 ? 'visible' : 'hidden';
                this.shadowRoot.querySelector('#mm').textContent = fmt(now.getMinutes());
            }
        }
    })
});