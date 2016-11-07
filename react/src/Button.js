import React from 'react'
import classNames from 'classnames'

const Button = ({ type, className, children, ...rest }) => {
  const classes = classNames({
    'b-button': true,
    [`b-button--${type}`]: type,
    [className]: className
  })
  return <button {...rest} className={classes}>{children}</button>
}

export default Button