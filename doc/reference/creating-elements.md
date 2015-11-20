# Creating elements

Creating a new HTML element is easy with Bosonic. Here is a boilerplate of a basic element (let's assume for now that you'll save this as `lib/hello-world.html`):

``` html
<element name="hello-world">
    <template>
        <span>I'm Shadow DOM</span>
    </template>
    <script>
        Bosonic.register({
            sayHello: function() {
                var span = this.shadowRoot.querySelector('span');
                span.textContent = 'Hello, world!';
            }
        });
    </script>
</element>
```

As you can see, the `<element>` tag that encapsulates our element's definition has a `name` attribute: it is of course mandatory, as it specifies the name of the HTML tag you’ll instantiate in the markup. As per spec, it __must__ contain a "-".

In the `<script>` element, we call `Bosonic.register` to register the API of our new element: all methods & properties defined here will become API methods & props of each attached element in a web page.

One of the Bosonic's features is the automatic rendering of the `<template>` tag content: this markup will become our elements' [Shadow DOM](http://webcomponents.org/polyfills/shadow-dom/). The `shadowRoot` property allows you to query and manipulate this Shadow DOM, as shown in the `sayHello` method.

Using our new element in a web page is easy too:

``` html
<!DOCTYPE html>
<html>
<head>
    <title>My Application</title>
    <meta charset="utf-8">
    <!-- Load the polyfills & runtime -->
    <script src="lib/webcomponents.js"></script>
    <script src="lib/bosonic-runtime.js"></script>
    <!-- Import the element -->
    <link rel="import" href="lib/hello-world.html">
</head>
<body>
    <!-- Declare the element -->
    <hello-world></hello-world>
</body>
</html>

```

If all goes well, you should see 'I'm Shadow DOM' in your browser. But remember our elements are just DOM elements ;) Open the web console of your browser and type the following:

``` js
var hello = document.querySelector('hello-world');
hello.sayHello();
```
You should now see 'Hello, world!' on screen. We've successfully used our element's API!
