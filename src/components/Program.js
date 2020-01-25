import React from 'react';
import { connect } from 'react-redux';

import {
  hover,
  selectRightStatement,
  selectWrongStatement,
  stopShaking,
  unhover,
} from '../actions';

import {
  Mode,
} from '../constants';

// --------------------------------------------------------------------------- 

class Program extends React.Component {
  render() {
    return (
      <div id="program" className="code">
        {this.props.program && this.props.program.programify(this, this.props, false, false, '')}
      </div>
    );
  }
}

// --------------------------------------------------------------------------- 

const mapStateToProps = state => {
  return {
    hoveredElement: state.hoveredElement,
    clickedElement: state.clickedElement,
    program: state.program,
    mode: state.mode,
    activeStatement: state.activeStatement,
    isBadSelection: state.isBadSelection,
    expression: state.expression,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onHover: (event, element) => dispatch(hover(element)),
    onUnhover: (event, element) => dispatch(unhover(element)),
    onStopShaking: () => dispatch(stopShaking()),
    onClick: (mode, clickedElement, activeElement, program, currentValue) => {
      // if (mode === Mode.SelectingStatement && activeElement !== null) {
        // console.log("activeElement:", activeElement);
        // console.log("currentValue:", currentValue);
        // console.log('next:', activeElement.getNextStatement(currentValue));
      // }
      
      if (mode === Mode.SelectingStatement &&
          ((activeElement === null && clickedElement === program.getFirstStatement()) ||
           (activeElement !== null && activeElement.getNextStatement(currentValue) === clickedElement))) {
        dispatch(selectRightStatement(clickedElement));
      } else {
        dispatch(selectWrongStatement(clickedElement));
      }
    },
  };
};

Program = connect(mapStateToProps, mapDispatchToProps)(Program);

export default Program;
