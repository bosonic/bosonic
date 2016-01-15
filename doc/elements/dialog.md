# Dialog

You may not love them, but modals are sometimes requested by customers...

## Example
<div class="element-demo" id="example"></div>

## Usage

``` html
<b-dialog> 
    <h3>Test</h3>
    <p>Hello world!</p>
    <button dialog-dismiss>Close</button>
</b-dialog>

<button id="show-modal">Show modal</button>

<script type="text/javascript">
    window.addEventListener("WebComponentsReady", function() {
        var showModalButton = document.getElementById('show-modal');
        showModalButton.addEventListener('click', function() {
            document.querySelector('b-dialog').showModal();
        }, false);
    });
</script>
```

A `<b-dialog>` is hidden by default, you must open it by calling its `show()` or `showModal()` method. But you can make it dismissable without any JS by adding a `dialog-dismiss` or `data-dialog-dismiss` attribute to any link or button inside the dialog content.

## Accessibility

`role="dialog"` and `aria-hidden="..."` attributes will be automatically added to the `<b-dialog>` element, but you must add yourself `aria-labelledby="..."` (referencing the dialog title) to the element, and `role="document"` to the dialog content. Focus "grab" will be automatically handled.

## Styling
The following variables are available for styling:

| Variable                         | Description                                  |
|----------------------------------|----------------------------------------------|
| --b-dialog-border                |                                              |
| --b-dialog-border-radius         |                                              |
| --b-dialog-shadow                |                                              |
| --b-dialog-padding-vertical      | Used for the margin of the dialog's content  |
| --b-dialog-padding-horizontal    | The horiz. padding for all dialog's contents |

## API

### Methods
- __show()__ / __open()__: opens the dialog.
- __hide()__ / __close()__: closes the dialog.
- __showModal()__: opens the dialog in a modal way (with an overlay).

### Events
- __b-dialog-close__: fired when the dialog is closed.
- __b-dialog-cancel__: cancelable event fired when the dialog is dismissed by using the ESC key.

