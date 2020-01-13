import React from 'react';
import { connect } from 'react-redux';

import {
  showMessage,
  evaluateSubexpression,
  hoverSubexpression,
  unhoverSubexpression,
} from '../actions';

class Evaluator extends React.Component {
  render() {
    return (
      <div id="evaluator">
        <div id="expression">
          {this.props.expression && this.props.expression.reactify(this.props)}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    expression: state.evaluator.expression,
    hoveredSubexpression: state.evaluator.hoveredSubexpression,
    activeSubexpression: state.evaluator.activeSubexpression,
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
      console.log("subexpression:", subexpression);
      if (expression.nextNonterminal === subexpression) {
        dispatch(showMessage("Solve."));
        dispatch(evaluateSubexpression(subexpression));
      } else {
        dispatch(showMessage("No, that's not it."));
      }
    },
  };
};

Evaluator = connect(mapStateToProps, mapDispatchToProps)(Evaluator);

export default Evaluator;
