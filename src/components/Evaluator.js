import React from 'react';
import { connect } from 'react-redux';

// import {
  // Mode,
// } from './constants';

import {
  editValue,
  evaluateCorrectly,
  evaluateIncorrectly,
  selectSubexpression,
  hover,
  selectMemoryValue,
  showMessage,
  startShakingOperation,
  stopShakingOperation,
  stopShakingEvaluation,
  unhover,
} from '../actions';

import {
  ExpressionBoolean,
  ExpressionInteger,
  ExpressionReal,
  ExpressionString,
} from '../ast';

class Evaluator extends React.Component {
  render() {
    return (
      <div id="evaluator">
        <div id="expression" className="code">
          {this.props.expression && this.props.expression.reactify(this, this.props)}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    expression: state.expression,
    hoveredElement: state.hoveredElement,
    activeSubexpression: state.activeSubexpression,
    isShakingOperation: state.isShakingOperation,
    isShakingEvaluation: state.isShakingEvaluation,
    mode: state.mode,
    value: state.value,
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
    onClickOperator: (expression, subexpression) => {
      if (expression.nextNonterminal === subexpression) {
        dispatch(showMessage("What's the value of this operation?"));
        dispatch(selectSubexpression(subexpression));
      } else {
        dispatch(showMessage("No, that's not it."));
        dispatch(startShakingOperation(subexpression));
      }
    },
    onClickIdentifier: (expression, subexpression) => {
      if (expression.nextNonterminal === subexpression) {
        dispatch(showMessage("What's the value of this variable?"));
        dispatch(selectSubexpression(subexpression));
      } else {
        dispatch(showMessage("No, that's not it."));
        dispatch(startShakingOperation(subexpression));
      }
    },
    onClickAssignment: (expression, subexpression) => {
      if (expression.nextNonterminal === subexpression) {
        dispatch(selectMemoryValue(subexpression.identifier.source));
      } else {
        dispatch(showMessage("No, that's not it."));
        dispatch(startShakingOperation(subexpression));
      }
    },
    onStopShakingOperation: () => dispatch(stopShakingOperation()),
    onStopShakingEvaluation: () => dispatch(stopShakingEvaluation()),
    onEditValue: value => dispatch(editValue(value)),
    onKeyDown: (e, env, expression, value) => {
      if (e.key === 'Enter') {
        const expected = expression.evaluate(env);

        let actual;
        if (value.match(/^-?\d+$/)) {
          actual = new ExpressionInteger(parseInt(value));
        } else if (value.match(/^-?(\d+\.\d*|\d*.\d+)$/)) {
          actual = new ExpressionReal(parseFloat(value));
        } else if (value.match(/^true$/)) {
          actual = new ExpressionBoolean(true);
        } else if (value.match(/^false$/)) {
          actual = new ExpressionBoolean(false);
        } else if (value.match(/^".*"$/)) {
          actual = new ExpressionString(value.slice(1, -1));
        } else {
          actual = new ExpressionString(value);
        }

        if (expected.equals(actual)) {
          dispatch(evaluateCorrectly(actual));
        } else {
          dispatch(evaluateIncorrectly(actual));
        }
      }
    }
  };
};

Evaluator = connect(mapStateToProps, mapDispatchToProps)(Evaluator);

export default Evaluator;
