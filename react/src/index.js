import React, { Component } from 'react'
import reactify from 'skatejs-react-integration'
import classNames from 'classnames'

import HelloWorldElement from '../../elements/lib/hello-world'
import DialogElement from '../../elements/lib/b-dialog'

// import '../../elements/src/layout/linear-layout.css'

// const LinearLayout = (props) => {
//   const { vertical, horizontal, verticalReverse, horizontalReverse, className, ...other } = props
//   const classes = classNames('layout', { vertical, horizontal, 'vertical-reverse': verticalReverse, 'horizontal-reverse': horizontalReverse }, className)
//   return <div className={classes}>{props.children}</div>
// }

const HelloWorld = reactify(HelloWorldElement)
const Dialog = reactify(DialogElement)
export { HelloWorld, Dialog/*, LinearLayout*/ }