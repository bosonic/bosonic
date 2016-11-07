import React from 'react'
import ReactDOM from 'react-dom'
import { compose, withState, withHandlers } from 'recompose'

import { Dialog, Button } from '../../src'
require('../../../elements/lib/styles.css')

const enhance = compose(
  withState('showDialog', 'toggle', false),
  withHandlers({
    onClick: props => event => {
      props.toggle(!props.showDialog)
    }
  })
)

const BosonicSamples = enhance(({ showDialog, onClick }) => 
    <div>
      <Button onClick={onClick}>Say hello</Button>
      <Dialog opened={showDialog}>
        <h3 className="b-dialog-title">Test</h3>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer venenatis sodales arcu, ac fermentum metus hendrerit non. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        <div className="b-dialog-buttons">
            <button className="b-button" data-dialog-dismiss>Close</button>
        </div>
      </Dialog>
    </div>
)

ReactDOM.render(
  <BosonicSamples/>,
  document.getElementById('example')
)