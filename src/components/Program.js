import React from 'react';
import { connect } from 'react-redux';

import {
  hover,
  selectRightProgramPiece,
  selectWrongProgramPiece,
  stopShakingProgramPiece,
  unhover,
} from '../actions';

import {
  Mode,
} from '../constants';

// --------------------------------------------------------------------------- 

class Program extends React.Component {
  render() {
    return (
      <div id="program">
        {this.props.program && this.props.program.programify(this, this.props)}
      </div>
    );
  }
}

// --------------------------------------------------------------------------- 

const mapStateToProps = state => {
  return {
    hoveredElement: state.hoveredElement,
    program: state.program,
    mode: state.mode,
    activeProgramPiece: state.activeProgramPiece,
    isShaking: state.isShaking,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onHover: element => dispatch(hover(element)),
    onUnhover: element => dispatch(unhover(element)),
    onStopShaking: () => dispatch(stopShakingProgramPiece()),
    onClick: (mode, actualElement) => {
      if (mode === Mode.SelectingProgramPiece) {
        dispatch(selectRightProgramPiece(actualElement));
      } else {
        dispatch(selectWrongProgramPiece(actualElement));
      }
    },
  };
};

Program = connect(mapStateToProps, mapDispatchToProps)(Program);

export default Program;
