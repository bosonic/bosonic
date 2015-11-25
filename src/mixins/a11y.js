var focusableElementsSelector ="a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";

Bosonic.A11y = {
    getFocusableElements: function(container) {
        container = container || this;
        return container.querySelectorAll(focusableElementsSelector);
    },

    getFirstFocusableElement: function(container) {
        container = container || this;
        return container.querySelector(focusableElementsSelector);
    }
};