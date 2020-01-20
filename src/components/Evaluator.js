import React from 'react';
import { connect } from 'react-redux';

import {
  editValue,
  evaluateCorrectly,
  evaluateIncorrectly,
  selectSubexpression,
  hoverSubexpression,
  showMessage,
  startShakingOperation,
  stopShakingOperation,
  stopShakingEvaluation,
  unhoverSubexpression,
} from '../actions';

import {
  ExpressionBoolean,
  ExpressionInteger,
  ExpressionReal,
  ExpressionString,
} from '../ast';

class Evaluator extends React.Component {
  // constructor(props) {
    // super(props);
    // this.state = {
      // isShakingEvaluation: false,
    // };
  // }

  // onKeyDown(e, expression, value) {
    // if (e.key === 'Enter') {
      // const expected = expression.evaluate();

      // let actual;
      // if (value.match(/^-?\d+$/)) {
        // actual = new ExpressionInteger(parseInt(value));
      // } else if (value.match(/^-?(\d+\.\d*|\d*.\d+)$/)) {
        // actual = new ExpressionReal(parseFloat(value));
      // } else if (value.match(/^true$/)) {
        // actual = new ExpressionBoolean(true);
      // } else if (value.match(/^false$/)) {
        // actual = new ExpressionBoolean(false);
      // } else if (value.match(/^".*"$/)) {
        // actual = new ExpressionString(value.slice(1, -1));
      // } else {
        // actual = new ExpressionString(value);
      // }

      // if (expected.equals(actual)) {
        // console.log("y");
        // dispatch(evaluateCorrectly(actual));
      // } else {
        // console.log("n");
        // this.setState({isShakingEvaluation: true});
        // dispatch(evaluateIncorrectly(actual));
      // }
    // }
  // }

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
    hoveredSubexpression: state.hoveredSubexpression,
    activeSubexpression: state.activeSubexpression,
    isShakingOperation: state.isShakingOperation,
    isShakingEvaluation: state.isShakingEvaluation,
    isEvaluating: state.isEvaluating,
    value: state.value,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onHover: (e, expression) => {
      e.stopPropagation();
      dispatch(hoverSubexpression(expression));
    },
    onUnhover: (e, expression) => {
      e.stopPropagation();
      dispatch(unhoverSubexpression(expression));
    },
    onClick: (expression, subexpression) => {
      if (expression.nextNonterminal === subexpression) {
        dispatch(showMessage("Solve."));
        dispatch(selectSubexpression(subexpression));
      } else {
        dispatch(showMessage("No, that's not it."));
        dispatch(startShakingOperation(subexpression));
      }
    },
    onStopShakingOperation: () => dispatch(stopShakingOperation()),
    onStopShakingEvaluation: () => dispatch(stopShakingEvaluation()),
    onEditValue: value => dispatch(editValue(value)),
    onKeyDown: (e, expression, value) => {
      if (e.key === 'Enter') {
        const expected = expression.evaluate();

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
