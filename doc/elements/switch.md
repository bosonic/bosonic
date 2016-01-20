# Switch

Extends the native `<input type="checkbox">` for a more modern look.

## Demo
<div class="element-demo" id="example"></div>

## Usage

```html
<input type="checkbox" is="b-switch"></input>
```

The `nocaption` attribute removes the default ON/OFF caption of the switch.

```html
<input type="checkbox" is="b-switch" nocaption></input>
```

You can control the switch with javascript, but due to the way native checkboxes work, you can't toggle the switch by setting the `checked` property (there is no way to intercept/observe the property change):
```javascript
var switch = document.querySelector('input[is=b-switch]');

switch.check();
switch.uncheck();

switch.checked; // returns a boolean
```

## Accessibility

As it's still a checkbox, it's accessible out of the box (pun intended). A `aria-hidden="true"` is set on the additional markup appended by the element, so that this markup is hidden to browsers using assistive technologies.

## Styling
The following variables are available for styling:

| Variable                         | Description                                                  |
|----------------------------------|--------------------------------------------------------------|
| --b-switch-thumb-color           | The color of the "thumb" (dragged part)                      |
| --b-switch-thumb-3d-effect       | The box-shadow applied to the thumb                          |
| --b-switch-pressed-effect        | The box-shadow applied to the background                     |
| --b-switch-height                | The height of the switch, used for calc. of other dimensions |
| --b-switch-border-radius         | Obvious                                                      |
| --b-switch-on-bg                 | The color of the background when the switch is "on"          |
| --b-switch-on-border             | The color of the background' border when the switch is "on"  |
| --b-switch-off-bg                | The color of the background when the switch is "off"         |
| --b-switch-off-border            | The color of the background' border when the switch is "off" |

## API

### Attributes
- __nocaption__: the switch will not display any caption.

### Properties
- __checked__: returns a boolean related to the state of the switch.

### Methods
- __check()__
- __uncheck()__



