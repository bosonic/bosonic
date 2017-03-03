import 'document-register-element'
import KeyListener from './helpers/KeyListener'

export default class ListboxElement extends HTMLElement {
  get items() {
    if (this._items !== undefined) return this._items
    return Array.prototype.slice.call(this.querySelectorAll('b-item'), 0)
  }

  get focusedItem() {
    if (this.items.indexOf(document.activeElement) !== -1) return document.activeElement
  }

  get focusedItemIndex() {
    if (!this.focusedItem) return -1
    return this.items.indexOf(this.focusedItem)
  }

  connectedCallback() {
    this.applyAria()
    this.initSelection()
    this.addEventListener('click', e => {
      this.onActivate(e)
    })
    this.addEventListener('focus', () => {
      this.onHostFocus()
    })
    this._keyListener = new KeyListener(this, {
      'up down': 'cycleFocus',
      'esc': 'echap',
      'enter': 'enter'
    })
  }

  onActivate(e) {
    let t = e.target
    while (t && t != this) {
      let idx = this.items.indexOf(t)
      if (idx !== -1) {
        this.activate(idx)
        return
      }
      t = t.parentNode
    }
  }

  activate(index) {
    if (this.dispatchEvent(new CustomEvent('b-listbox-activate', { cancelable: true }))) {
      this.select(index)
    }
  }

  applyAria() {
    this.setAttribute('role', 'listbox')
    this.tabIndex = 0
    this.items.forEach(item => {
      item.setAttribute('role', 'option')
      item.tabIndex = -1
    })
    if (this.items[0]) this.items[0].tabIndex = 0
  }

  onHostFocus() {
    this.focusFirstItem()
  }

  cycleFocus(e, key) {
    if (!this.focusedItem) {
      this.focusFirstItem()
      return
    }
    var focusedItemIndex = this.focusedItemIndex,
      lastItemIndex = this.items.length - 1
    if (key === 'down' && focusedItemIndex < lastItemIndex) {
      this.items[focusedItemIndex + 1].focus()
    } else if (key === 'up' && focusedItemIndex > 0) {
      this.items[focusedItemIndex - 1].focus()
    }
  }

  focusFirstItem() {
    this.items[0].focus()
  }

  enter(e) {
    if (!this.focusedItem) return
    this.selectedItems.indexOf(this.focusedItemIndex) !== -1 ? this.unselect(this.focusedItemIndex) : this.select(this.focusedItemIndex)
  }

  echap() {
    if (!this.open) {
        return
    }
    this.hide()
    this.button.focus()
  }

  // SELECTION HANDLING
  //--------------------
  get multiple() {
    if (this._multiple === undefined) {
      this._multiple = this.hasAttribute('multiple')
    }
    return this._multiple
  }

  set multiple(value) {
    this._multiple = !!value
  }

  get selectedIndex() {
    return this._selected.length === 0 ? -1 : this._selected[0]
  }

  set selectedIndex(value) {
    this._selected.forEach(function(index) {
      this.unselect(index)
    }, this)
    this.select(value)
  }

  get selectedItems() {
    return this._selected
  }

  initSelection() {
    this._selected = []
    if (this.hasAttribute('selected')) {
      this.selectedIndex = Number(this.getAttribute('selected'))
    }
  }

  select(index) {
    if (!this.multiple && this.selectedIndex !== -1) {
      this.unselect(this.selectedIndex)
    }
    this._select(index)
  }

  unselect(index) {
    var item = this._getItem(index)
    if (!item) return
    item.removeAttribute('aria-selected')
    this._selected.splice(this._selected.indexOf(index), 1)
    this.dispatchEvent(new CustomEvent('b-listbox-unselect'))
  }

  _select(index) {
    var item = this._getItem(index)
    if (!item) return
    item.setAttribute('aria-selected', 'true')
    this._selected.push(index)
    this.dispatchEvent(new CustomEvent('b-listbox-select'))
  }

  _getItem(index) {
    return this._getItems()[index] || null
  }

  _getItemCount() {
    return this._getItems().length
  }

  _getItems() {
    if (this.items) return this.items
    var target = this.getAttribute('target')
    var nodes = target ? this.querySelectorAll(target) : this.children
    return Array.prototype.slice.call(nodes, 0)
  }
}

customElements.define('b-listbox', ListboxElement)
