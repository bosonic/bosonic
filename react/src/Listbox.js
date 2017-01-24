import React from 'react'
import reactify from '../vendor/react-integration'

import ListboxElement from '../../elements/lib/b-listbox'

const Listbox = reactify(ListboxElement)
export default Listbox

export const Item = ({ children }) => <b-item>{children}</b-item>
