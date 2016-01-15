# Notification

A notification element with four different levels.

## Demo
<div class="element-demo" id="basic-demos"></div>

## Usage

``` html
<b-notification visible type="info" duration="2000" dismissable>
    <strong>Hello, World!</strong> Foo Bar
</b-notification>
```

Will display a dismissable info notification during 2 secs containing the string "Hello, World! Foo Bar".

## Styling

The following variables are available for styling:

| Variable                        | Description                                  |
|---------------------------------|----------------------------------------------|
| --b-notification-font-size      |                                              |
| --b-notification-border-radius  |                                              |
| --b-notification-padding        |                                              |
| --b-notification-margin         | The margin relative to viewport border when positioned. |
| --b-notification-<level>-bg     | The background color, for each level |
| --b-notification-<level>-border | The border color, for each level |
| --b-notification-<level>-color  | The font color, for each level |

## API

### Attributes
- __visible__: controls the display of the message.
- __dismissable__: adds a close button to the notification.
- __type__: four possible values: `info`, `success`, `warning` and `error`, respectively blue, green, yellow and red. By default this attribute is set to `info`.
- __position__: position relative to the viewport: `top`, `bottom`, `top-left`, `top-right`, `bottom-left`, `bottom-right`.
- __duration__: Trigger a timeout when the message is displayed (see `show` accessor). Valid value is a number given in milliseconds.

### Methods
- __show()__: displays the notification. If the attribute `duration` is set to a valid value, the message will be hidden automatically after specified number of milliseconds.
- __hide()__: hides the notification.
- __close()__: removes the notification from the DOM.

### Events
- __b-notification-show__: will fire when the notification is shown.
- __b-notification-hide__: will fire when the notification is hidden.
- __b-notification-close__: will fire when the notification is closed.