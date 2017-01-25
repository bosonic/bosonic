import React from 'react'
import reactify from '../vendor/react-integration'

import MenuButtonElement from 'bosonic/lib/b-menu-button'
import Listbox, { Item } from './Listbox'

export const MenuButton = reactify(MenuButtonElement)
const Menu = Listbox

export { Item }

export default Menu
