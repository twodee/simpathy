import React from 'react';
import { connect } from 'react-redux';

import StackFrame from './StackFrame';

class Memory extends React.Component {
  render() {
    return (
      <div id="memory">
        <div id="frames">
          { this.props.frames.map((frame, i) => <StackFrame key={`${frame.name}-${i}`} name={frame.name} variables={frame.variables} isFirst={i === 0} />) }
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    frames: state.memory.frames,
  };
};

const mapDispatchToProps = dispatch => {
  return {
  };
};

Memory = connect(mapStateToProps, mapDispatchToProps)(Memory);

export default Memory;
