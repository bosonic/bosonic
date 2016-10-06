import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { compose, withState, withHandlers } from 'recompose'

import { HelloWorld } from '../../src/react'

const enhance = compose(
  withState('showHello', 'toggle', false),
  withHandlers({
    onClick: props => event => {
      props.toggle(!props.showHello)
    }
  })
)

const HelloWorldSample = enhance(({ showHello, onClick }) => 
    <div>
      <button onClick={onClick}>Say hello</button>
      <HelloWorld visible={showHello}/>
    </div>
)

ReactDOM.render(
  <HelloWorldSample/>,
  document.getElementById('example')
)