# Switch

An element used to select a boolean value. 

## Demo
<div class="element-demo" id="example"></div>

## Usage

The `checked` attribute indicates the state ON of the switch.

```html
<b-switch checked></b-switch>
```

The `nocaption` attribute removes the default ON/OFF caption of the switch.

```html
<b-switch nocaption></b-switch-button>
```

The `oncaption` and `offcaption` attributes let you change the caption of the switch. If the caption is too long, use a padding-right and padding-left directive to adapt the size of the switch.
```html
<b-switch style="padding: 0 15px" oncaption="activated" offcaption="deactivated"></b-switch>
```

You can control the switch with javascript:
```javascript
var switch = document.querySelector('b-switch');

switch.activate(); // activate
switch.deactivate(); // deactivate
switch.toggle(); // toggle

switch.value; // returns a boolean
switch.checked; // returns a boolean
switch.checked = true; // activate the button
switch.checked = false; // deactivate the button
```

## Accessibility

ARIA authoring practices are automatically handled by the element. The user can use the keyboard to toggle the switch: SPACE/ENTER.

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
- __oncaption__: specifies the caption to show when the switch is activated.
- __offcaption__: specifies the caption to show when the switch is disactivated.

### Properties
- __value__: returns a boolean related to the state of the switch.
- __checked__: returns a boolean related to the state of the switch.

### Methods
- __activate()__
- __deactivate()__
- __toggle()__


