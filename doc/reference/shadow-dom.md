# Shadow DOM

One of the best Shadow DOM features (if not the best) is the mechanism of distribution of Light DOM child nodes.
 
You can define __insertion points__ in your Shadow DOM with the `<content>` element, in which Bosonic will pull Light DOM nodes. For example:

``` html
<element name="hello-world">
    <template>
        <!-- This is our Shadow DOM -->
        <div class="title">
            <content select="h3"></content>
        </div>
        <content></content>
    </template>
    <script>
        Bosonic.register({
            ...
        });
    </script>
</element>
```
In this example, we've defined two distribution points. As you can probably guess, the `select` attribute takes a CSS selector and is used to target a specific node in the Light DOM to be distributed at a specific point. The second `<content>` will simply distribute the rest of the Light DOM nodes at this insertion point.

If we put our element into use like this:
``` html
<!-- This is our shadow host -->
<b-hello-world>
    <!-- This is our Light DOM -->
    <h3>Hello world</h3>
    <p>Lorem ipsum</p>
    <button>Ok</button>
</b-hello-world>
```

The resulting composed DOM will look like this:

``` html
<b-hello-world>
    <div class="title">
        Hello world
    </div>
    <p>Lorem ipsum</p>
    <button>Ok</button>
</b-hello-world>
```


