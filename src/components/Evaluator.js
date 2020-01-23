import React from 'react';
import { connect } from 'react-redux';

import {
  editInput,
  hover,
  enterRightSubexpressionValue,
  enterWrongSubexpressionValue,
  selectRightSubexpression,
  selectWrongSubexpression,
  stopShaking,
  unhover,
} from '../actions';

import {
  parseLiteral,
} from '../ast';

// --------------------------------------------------------------------------- 

class Evaluator extends React.Component {
  render() {
    return (
      <div id="evaluator">
        <div id="expression" className="code">
          {this.props.expression && this.props.expression.evaluatorify(this, this.props)}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    expression: state.expression,
    hoveredElement: state.hoveredElement,
    clickedElement: state.clickedElement,
    activeSubexpression: state.activeSubexpression,
    isBadInput: state.isBadInput,
    isBadSelection: state.isBadSelection,
    mode: state.mode,
    currentInput: state.currentInput,
    env: state.frames[0],
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onHover: (e, expression) => {
      e.stopPropagation();
      dispatch(hover(expression));
    },
    onUnhover: (e, expression) => {
      e.stopPropagation();
      dispatch(unhover(expression));
    },
    onClick: (mode, clickedElement, expression) => {
      if (expression.nextNonterminal === clickedElement) {
        dispatch(selectRightSubexpression(clickedElement));
      } else {
        dispatch(selectWrongSubexpression(clickedElement));
      }
    },
    onStopShaking: () => dispatch(stopShaking()),
    onEditInput: value => dispatch(editInput(value)),
    onKeyDown: (e, env, expression, value) => {
      if (e.key === 'Enter') {
        const expected = expression.evaluate(env);
        let actual = parseLiteral(value);

        if (expected.equals(actual)) {
          dispatch(enterRightSubexpressionValue(actual));
        } else {
          dispatch(enterWrongSubexpressionValue(actual));
        }
      }
    }
  };
};

Evaluator = connect(mapStateToProps, mapDispatchToProps)(Evaluator);

export default Evaluator;
