import React from 'react'
import reactify from './reactify'

import ListboxElement from 'bosonic/lib/b-listbox'

const Listbox = reactify(ListboxElement)
export default Listbox

export const Item = ({ children }) => <b-item>{children}</b-item>
