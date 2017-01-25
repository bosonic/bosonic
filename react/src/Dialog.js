import React from 'react'
import reactify from '../vendor/react-integration'

import DialogElement from 'bosonic/lib/b-dialog'

const DialogComponent = reactify(DialogElement)
const Dialog = ({ title, footer, children, ...rest }) => (
  <DialogComponent {...rest}>
    <h3 className="b-dialog-title">{title}</h3>
    {children}
    {footer && <div className="b-dialog-buttons">
        {footer}
    </div>}
  </DialogComponent>
)

export default Dialog
