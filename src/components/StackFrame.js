import React from 'react';
import { connect } from 'react-redux';

import {
  editInput,
  enterRightMemoryValue,
  enterWrongMemoryValue,
  hover,
  selectRightMemoryValue,
  selectWrongMemoryValue,
  stopShakingMemoryValueInput,
  stopShakingMemoryValueSelection,
  unhover,
} from '../actions';

import {
  Mode,
} from '../constants';

import {
  parseLiteral,
} from '../ast';

class StackFrame extends React.Component {
  render() {
    const frame = this.props.frames[this.props.index];

    return (
      <div className="stack-frame">
        <div className="code cell function-name-cell cell-in-row-0">{frame.name}</div>
        {
          frame.variables.map((variable, i) => {
            let element;
            if (this.props.mode === Mode.EnteringMemoryValue && this.props.index === 0 && this.props.activeSubexpression.identifier.source === variable.name) {
              element = <input
                type="text"
                autoFocus
                autoComplete="off"
                spellCheck="false"
                className={`memory-value-input ${this.props.isShaking ? 'shaking' : ''}`}
                value={this.props.currentInput}
                onAnimationEnd={this.props.onStopShakingInput}
                onChange={e => this.props.onEditInput(e.target.value)}
                onKeyDown={e => this.props.onKeyDown(e, this.props.activeSubexpression, this.props.currentInput)}
                />
            } else if (this.props.mode === Mode.SelectingMemoryValue) {
              element = <span
                className={`evaluatable ${variable === this.props.hoveredElement ? 'hovered' : ''} ${this.props.isShaking && variable === this.props.activeElement ? 'shaking' : ''}`}
                onAnimationEnd={this.props.onStopShakingSelection}
                onMouseOver={e => this.props.onHover(e, variable)}
                onMouseOut={e => this.props.onUnhover(e, variable)}
                onClick={e => this.props.onClickMemoryValue(this.props.index, this.props.activeSubexpression, variable)}>{variable.current.value}</span>
            } else {
              element = <span>{variable.current.value}</span>;
            }

            return (
              <React.Fragment key={variable.name}>
                <div className="code cell variable-name-cell">{variable.name}</div>
                <div className={`cell arrow-cell cell-in-row-${i}`}>&rarr;</div>
                <div className="code cell variable-value-cell">{element}</div>
                <div className="code cell variable-history-cell">{variable.history.map((old, i) => <span key={`value-${variable.history.length - 1 - i}`} className="old">{old.value}</span>)}</div>
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
    activeSubexpression: state.activeSubexpression,
    frames: state.frames,
    hoveredElement: state.hoveredElement,
    expectedElement: state.expectedElement,
    activeElement: state.activeElement,
    isShaking: state.isShaking,
    mode: state.mode,
    currentInput: state.currentInput,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onHover: (e, element) => dispatch(hover(element)),
    onUnhover: (e, element) => dispatch(unhover(element)),
    onClickMemoryValue: (frameIndex, activeSubexpression, actualElement) => {
      if (frameIndex === 0 && activeSubexpression.identifier.source === actualElement.name) {
        dispatch(selectRightMemoryValue(actualElement));
      } else {
        dispatch(selectWrongMemoryValue(actualElement));
      }
    },
    onStopShakingSelection: () => {
      dispatch(stopShakingMemoryValueSelection());
    },
    onStopShakingInput: () => {
      dispatch(stopShakingMemoryValueInput());
    },
    onEditInput: value => dispatch(editInput(value)),
    onKeyDown: (event, assignmentExpression, value) => {
      if (event.key === 'Enter') {
        const expected = assignmentExpression.value;
        const actual = parseLiteral(value);
        if (expected.equals(actual)) {
          dispatch(enterRightMemoryValue());
        } else {
          dispatch(enterWrongMemoryValue());
        }
      }
    },
  };
};

StackFrame = connect(mapStateToProps, mapDispatchToProps)(StackFrame);

export default StackFrame;
