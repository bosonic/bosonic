# Styling elements
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

## FOUC prevention

Before custom elements upgrade they may display incorrectly. To prevent FOUC, the [`webcomponents.js`](http://webcomponents.org/polyfills/) polyfill library injects styles that hide the document body if it has an `unresolved` attribute. The simplest solution is therefore to add the `unresolved` attribute to body (it will be removed automatically by Bosonic when the custom elements have upgraded):

``` html
<body unresolved>
```

For finer control, Bosonic automatically adds a `resolved` class to each upgraded element. This allows you to mitigate FOUC issues by yourself, for instance:

``` css
b-dialog:not(.resolved) {
    display: none;
}
```

The theme additional stylesheet includes FOUC prevention styles for each element.