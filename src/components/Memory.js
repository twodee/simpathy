import React from 'react';
import { connect } from 'react-redux';

import StackFrame from './StackFrame';

class Memory extends React.Component {
  render() {
    return (
      <div id="memory">
        <div id="frames">
          { this.props.frames.map((frame, i) => <StackFrame key={`${frame.name}-${i}`} index={i} />) }
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    frames: state.frames,
    mode: state.mode,
    hoveredMemoryValue: state.hoveredMemoryValue,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onHover: null,
    onUnhover: null,
  };
};

Memory = connect(mapStateToProps, mapDispatchToProps)(Memory);

export default Memory;
