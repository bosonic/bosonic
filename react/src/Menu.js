import React from 'react'
import reactify from '../vendor/react-integration'

import MenuButtonElement from '../../elements/lib/b-menu-button'
import Listbox from './Listbox'

export const MenuButton = reactify(MenuButtonElement)
const Menu = Listbox

export default Menu
