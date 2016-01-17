# Tooltip

## Demo
<div class="element-demo" id="example"></div>

## Usage

A `<b-tooltip>` will appear when the user hovers (or focus) over the element specified in the `for` attribute. Its placement relative to the element is determined by the value of the `position` attribute (possible values are: `left`, `right`, `top` or `bottom`).

``` html
<button id="btn">Tooltip on left</button>
<b-tooltip for="btn" position="left">Tooltip text</b-tooltip>
```

## Styling
The following variables are available for styling:

| Variable                         | Description                            |
|----------------------------------|----------------------------------------|
| --b-tooltip-background           | The background color of tooltips       |
| --b-tooltip-color                | The color of tooltips' text            |
| --b-tooltip-shadow               | The box-shadow of tooltips             |

## API

### Methods
- __show()__
- __hide()__
