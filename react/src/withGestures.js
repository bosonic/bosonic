import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import GestureListener from 'bosonic/lib/helpers/GestureListener'

const withGestures = (eventHandlers) => {
  return WrappedComponent => {
    return class WithGesturesComponent extends Component {
      componentDidMount() {
        this.listener = new GestureListener(
          ReactDOM.findDOMNode(this),
          eventHandlers(this.props)
        )
      }

      componentWillUnmount() {
        this.listener.dispose()
      }

      render() {
        return (
          <WrappedComponent {...this.props} />
        )
      }
    }
  }
}

export default withGestures
