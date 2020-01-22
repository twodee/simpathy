import React from 'react';
import { connect } from 'react-redux';

import {
  editInput,
  enterRightSubexpressionValue,
  enterWrongSubexpressionValue,
  selectRightSubexpression,
  hover,
  selectAssignment,
  showMessage,
  selectWrongSubexpression,
  stopShakingOperation,
  stopShakingEvaluation,
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
    activeSubexpression: state.activeSubexpression,
    isShaking: state.isShaking,
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
    onClickOperator: (expression, subexpression) => {
      if (expression.nextNonterminal === subexpression) {
        dispatch(selectRightSubexpression(subexpression, "Evaluate this operation."));
      } else {
        dispatch(selectWrongSubexpression(subexpression, "No, that's not it."));
      }
    },
    onClickIdentifier: (expression, subexpression) => {
      if (expression.nextNonterminal === subexpression) {
        dispatch(selectRightSubexpression(subexpression, "What's the value bound to this variable?"));
      } else {
        dispatch(selectWrongSubexpression(subexpression, "No that's not it."));
      }
    },
    onClickAssignment: (expression, subexpression) => {
      if (expression.nextNonterminal === subexpression) {
        dispatch(selectAssignment(subexpression));
      } else {
        dispatch(showMessage("No, that's not it."));
        dispatch(selectWrongSubexpression(subexpression));
      }
    },
    onStopShakingOperation: () => dispatch(stopShakingOperation()),
    onStopShakingEvaluation: () => dispatch(stopShakingEvaluation()),
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
