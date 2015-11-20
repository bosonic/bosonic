# Working with frameworks

## React
Bosonic core elements work well with [React](http://facebook.github.io/react/index.html): as Andrew Rota put it, [they're quite complementary](http://webcomponents.org/presentations/complementarity-of-react-and-web-components-at-reactjs-conf/) actually.

In the sample below, we use a Bosonic element in JSX:

``` html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React!</title>
    <script src="lib/webcomponents.js"></script>
    <script src="lib/bosonic-runtime.js"></script>
    <link rel="import" href="lib/bosonic-core-elements/b-collapsible.html"/>
    <script src="lib/react.js"></script>
    <script src="lib/JSXTransformer.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/jsx">
      var Foo = React.createClass({
        render: function() {
          return (
            <div>
              <button onClick={this.toggle}>Toogle collapsible</button>
              <b-collapsible ref="collapsible" data-duration="100">
                  <div>
                      Lorem ipsum...
                  </div>
              </b-collapsible>
            </div>
          );
        },
        toggle: function() {
          React.findDOMNode(this.refs.collapsible).toggle();
        }
      });
      
      React.render(
        <Foo/>,
        document.getElementById('example')
      );
    </script>
  </body>
</html>
```
As React doesn't support custom HTML attributes, Bosonic elements support `data-` prefixed attributes: if an element uses a `duration` attribute for instance, it will work with `data-duration` too (this what we use in the sample). Accessing an element's API is easy: use `React.findDOMNode()`. Listening to elements' DOM events is [easy](https://facebook.github.io/react/tips/dom-event-listeners.html) too.

## Ember
The Ember team strongly [believes into Web Components](http://guides.emberjs.com/v1.10.0/components/). The integration of Bosonic elements in a Ember application is therefore very easy.

## Angular
It seems that Angular 1.x has some issues with Web Components due to the way it handles its templates (basically, elements' `createdCallback()` are called multiple times). We're investigating to see if we can workaround this problem.

Angular 2 should be fine.