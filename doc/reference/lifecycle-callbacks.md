# Lifecycle callbacks

Lifecycle callbacks are special methods defined by the Custom Elements specification which fire when the element go through specific changes during its lifetime:

- `createdCallback()` is called when a custom element is created.
- `attachedCallback()` is called when a custom element is inserted into a DOM subtree.
- `detachedCallback()` is called when a custom element is removed from a DOM subtree.
- `attributeChangedCallback(attributeName, oldValue, newValue)` is called when a custom element's attribute value has changed.

## Automatic changed attributes callback

Bosonic provides a useful feature: if you declare the attributes used by your element in the `<element>` tag, like this:
``` html
<element name="hello-world" attributes="opened active">
    ...
</element>
```

Bosonic will automatically call methods named after the attributes, i.e:
``` js
Bosonic.register({
    openedChanged: function(old, new) {}
    activeChanged: function(old, new) {}
});
```

## Observing children mutations

Bosonic provides support for `childListChangedCallback(removedNodes, addedNodes)`: if you define this callback in your element's code, Bosonic will setup a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) that will call your method with the removed and added nodes as arguments whenever you add or remove children to/from your element.