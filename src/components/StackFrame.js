import React from 'react';
import { connect } from 'react-redux';

import {
  selectRightMemoryValue,
  selectWrongMemoryValue,
  hover,
  unhover,
  stopShakingMemoryValue,
} from '../actions';

import {
  Mode,
} from '../constants';

class StackFrame extends React.Component {
  render() {
    const frame = this.props.frames[this.props.index];

    return (
      <div className="stack-frame">
        <div className="code cell function-name-cell cell-in-row-0">{frame.name}</div>
        {
          frame.variables.map((variable, i) => {
            let element;
            if (this.props.mode === Mode.UpdateMemoryValue && this.props.index == 0 && this.props.expectedElement === variable.name) {
              element = <input type="text" className="memory-value-input" autoFocus />
            } else if (this.props.mode === Mode.SelectMemoryValue) {
              element = <span
                className={`evaluatable ${variable === this.props.hoveredElement ? 'hovered' : ''} ${this.props.isShaking && variable === this.props.activeElement ? 'shaking' : ''}`}
                onAnimationEnd={this.props.onStopShaking}
                onMouseOver={e => this.props.onHover(e, variable)}
                onMouseOut={e => this.props.onUnhover(e, variable)}
                onClick={e => this.props.onClickMemoryValue(this.props.index, this.props.expectedElement, variable)}>{variable.current.value}</span>
            } else {
              element = <span>{variable.current.value}</span>;
            }

            return (
              <React.Fragment key={variable.name}>
                <div className="code cell variable-name-cell">{variable.name}</div>
                <div className={`cell arrow-cell cell-in-row-${i}`}>&rarr;</div>
                <div className="code cell variable-value-cell">{element}</div>
                <div className="code cell variable-history-cell">{variable.history.map((old, i) => <span key={`value-${variable.history.length - 1 - i}`} className="old">{old}</span>)}</div>
              </React.Fragment>
            );
          })
        }
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    frames: state.frames,
    hoveredElement: state.hoveredElement,
    expectedElement: state.expectedElement,
    activeElement: state.activeElement,
    isShaking: state.isShaking,
    mode: state.mode,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onHover: (e, element) => dispatch(hover(element)),
    onUnhover: (e, element) => dispatch(unhover(element)),
    onClickMemoryValue: (frameIndex, expectedElement, actualElement) => {
      if (frameIndex === 0 && expectedElement === actualElement.name) {
        dispatch(selectRightMemoryValue(actualElement));
      } else {
        dispatch(selectWrongMemoryValue(actualElement));
      }
    },
    onStopShaking: () => {
      dispatch(stopShakingMemoryValue());
    }
  };
};

StackFrame = connect(mapStateToProps, mapDispatchToProps)(StackFrame);

export default StackFrame;
