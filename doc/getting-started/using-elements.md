# Using elements

Now that you've decided to use Bosonic and some of its elements, it's time to put them to good use. For the sake of simplicity, we'll assume you put the downloaded files into a `lib` folder next to a blank HTML page. To use Bosonic elements, you first need to include the [`webcomponents.js`](http://webcomponents.org/polyfills/) polyfill library, and then the Bosonic runtime. Once this step is complete, you can import the element or elements you want to play with using an [HTML import](http://webcomponents.org/articles/introduction-to-html-imports/).

``` html
<!DOCTYPE html>
<html>
    <head>
        <title>My Application</title>
        <meta charset="utf-8">
        <!-- Load the library which contains the various Web Components polyfills -->
        <script src="lib/webcomponents.js"></script>
        <!-- Load the Bosonic runtime -->
        <script src="lib/bosonic-runtime.js"></script>
        <!-- Import the element you want to play with -->
        <link rel="import" href="lib/b-dialog.html">
    </head>
    <body>

        <!-- Declare the element -->
        <b-dialog>
            <b-dialog-content>
                <h3>Test</h3>
                <p>Hello world!</p>
                <button data-dialog-dismiss>Close</button>
            </b-dialog-content>
        </b-dialog>

        <button id="show-modal">Show modal</button>

        <!-- Here we add a listener on the button to open the modal when clicked -->
        <script type="text/javascript">
            // Custom elements need time to "upgrade", wait for WebComponentsReady before manipulating them
            window.addEventListener("WebComponentsReady", function() {
                var showModalButton = document.getElementById('show-modal');
                showModalButton.addEventListener('click', function() {
                    document.querySelector('b-dialog').showModal();
                }, false);
            });
        </script>

    </body>
</html>
```

We just added a [dialog](/elements/dialogs-modals.html) into our page! As you can see in the sample above, you can manipulate your dialog element just like a native HTML one, using standard DOM features:

## Attributes
Element behavior can be modified by using specific [HTML attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes). For example, if we add a `opened` attribute to a [`b-collapsible`](/elements/collapsible.html) element, it will be opened by default:

``` html
<b-collapsible opened>
    <div>
        Lorem ipsum...
    </div>
</b-collapsible>
```
This attribute can be added using the DOM standard API, too:
``` js
var collapsible = document.querySelector('b-collapsible');
collapsible.setAttribute('opened', '');
```

## Elements API
Like native HTML elements, Bosonic elements expose an API: properties and methods that trigger various behaviors. In the `b-dialog` sample above, we used the `showModal()` method to open the dialog with an overlay. Similarly, we could have used the `opened` property of the `b-collapsible` element to open it:
``` js
var collapsible = document.querySelector('b-collapsible');
collapsible.opened = true;
```
Please refer to the [elements' documentation](/elements/dialogs-modals.html) for more information about their specific APIs.

## Custom events
Bosonic elements emit various [custom events](https://developer.mozilla.org/en-US/docs/Web/API/Event) during their lifecycle. For instance, `b-collapsible` emits a `b-collapsible-show` event when it is about to be shown, event that you can listen too and even cancel:
``` js
var collapsible = document.querySelector('b-collapsible');
collapsible.addEventListener('b-collapsible-show', function(event) {
    event.preventDefault();
});
```
Again, please refer to the elements documentation for more information about the events they publish.

## WebComponentsReady event
The [Custom Elements](http://webcomponents.org/polyfills/custom-elements/) polyfill handles element upgrades asynchronously. When the browser parses your page's markup, it doesn't recognize custom elements at first, they're therefore interpreted as `HTMLUnknownElement`. When `DOMContentsLoaded` is fired, the polyfill will take a look at each of the unknown elements in the page, see if they have been registered as custom elements, and then upgrade them to custom elements with APIs. Consequently, custom elements API are not available until after they have been upgraded. That's why you need to listen to the `WebComponentsReady` event (that will be fired by the polyfill) before trying to use their APIs.
``` js
window.addEventListener("WebComponentsReady", function() {
    var showModalButton = document.getElementById('show-modal');
    showModalButton.addEventListener('click', function() {
        document.querySelector('b-dialog').showModal();
    }, false);
});
```

## Styling elements
There are basically two types of elements: those that use [Shadow DOM](http://webcomponents.org/polyfills/shadow-dom/) and those that don't. The elements that don't use Shadow DOM are easy to style. They work just like standard HTML and use classic global CSS selectors:

``` html
<style>
b-dropdown.modern {
    border: 1px solid #ccc;
}
b-dropdown.modern > button {
    background-color: #ccc;
}
</style>

<b-dropdown class="modern">
    <button>Dropdown</button>
    <ul>
        <li>plain text</li>
        <li><a href="#">link item</a></li>
        <hr />
        <li><a href="#">separated link</a></li>
    </ul>
</b-dropdown>
```

Elements that use Shadow DOM extensively (for instance, [`b-tooltip`](/elements/tooltips.html)) can be a bit more complicated to style. The reason for that is that Shadow DOM scopes and encapsulates CSS, making it theoretically immune from style leakage. Of course,  Web Component creators want to theme their custom elements, and therefore they need to alter the CSS within the element. The Shadow DOM spec authors have provided pseudo-selectors (`/deep/` and `::shadow`) in order to achieve this, but they're not easy to use. They additionally introduce another round of problems.

The Polymer authors found themselves in the quest of a better way. They decided to use [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables) to achieve easy theming strategy for elements utilizing Shadow DOM. In using CSS Variables, elements declare their variables by setting some CSS properties like color or padding. Variables that can be set in an external stylesheet as seen in this example:

``` html
<style>
:root {
    --b-tooltip-background: red;
}
</style>

<b-tooltip for="btn">Tooltip text</b-tooltip>
<button id="btn">My button</button>
```
This is a great idea, and we've started to add some CSS variables in our elements too. Please keep in mind that CSS Variables are still an experimental feature and as of now Firefox is the only browser with a implementation of them. Polymer includes a shim in order to support CSS variables in all browsers, but it comes with a non-negligible performance cost. This is why the Bosonic team is actively developing a small build tool based on an existing CSS post-processor. This will make these CSS Variables able to work in every browser. This tool will be released in a few weeks, stay tuned!

## Interoperability

Bosonic is built on top of the [web components polyfill library](http://webcomponents.org/polyfills/) just like Polymer and x-tag are. This means that you can happily mix Bosonic, Polymer, and x-tag elements on the same page!