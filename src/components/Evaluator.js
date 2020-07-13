import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  enterRightSubexpressionValue,
  enterWrongSubexpressionValue,
  selectRightSubexpression,
  selectWrongSubexpression,
  crashRightly,
  crashWrongly,
  stopShaking,
} from '../actions';

import {
  parseLiteral,
} from '../ast';

import {
  Mode,
} from '../constants';

// --------------------------------------------------------------------------- 

const Evaluator = () => {
  const state = {
    hoveredElement: useSelector(state => state.hoveredElement),
    clickedElement: useSelector(state => state.clickedElement),
    program: useSelector(state => state.program),
    mode: useSelector(state => state.mode),
    activeSubexpression: useSelector(state => state.activeSubexpression),
    isBadSelection: useSelector(state => state.isBadSelection),
    isBadInput: useSelector(state => state.isBadInput),
    isBadCrash: useSelector(state => state.isBadCrash),
    isCrashing: useSelector(state => state.isCrashing),
    expression: useSelector(state => state.expression),
    currentInput: useSelector(state => state.currentInput),
    expectedValue: useSelector(state => state.expectedValue),
  };

  const dispatch = useDispatch();

  let crashAttributes = {
    className: state.isBadCrash ? 'shaking' : '',
    onClick: () => {
      if (state.mode === Mode.EvaluatingSubexpression && state.isCrashing) {
        dispatch(crashRightly());
      } else {
        dispatch(crashWrongly());
      }
    },
    onAnimationEnd: () => dispatch(stopShaking()),
  };
  const crashButton = React.createElement('button', crashAttributes, 'crash');

  const callbacks = {
    onClick: clickedElement => {
      if (state.mode === Mode.SelectingSubexpression && state.expression.nextNonterminal === clickedElement) {
        dispatch(selectRightSubexpression(clickedElement));
      } else {
        dispatch(selectWrongSubexpression(clickedElement));
      }
    },
    onKeyDown: e => {
      if (e.key === 'Enter') {
        let actualValue = parseLiteral(state.currentInput);

        if (state.isCrashing) {
          dispatch(enterWrongSubexpressionValue(<>No, <code className="code prompt-code">{state.currentInput}</code> is not the right value.</>));
        } else if (!actualValue) {
          dispatch(enterWrongSubexpressionValue(<>No, <code className="code prompt-code">{state.currentInput}</code> is not a legal primitive.</>));
        } else if (state.expectedValue.equals(actualValue)) {
          dispatch(enterRightSubexpressionValue(actualValue));
        } else if (state.expectedValue.constructor !== actualValue.constructor) {
          dispatch(enterWrongSubexpressionValue(<>No, <code className="code prompt-code">{state.currentInput}</code> is not of the right type.</>));
        } else {
          dispatch(enterWrongSubexpressionValue(<>No, <code className="code prompt-code">{state.currentInput}</code> is not the right value.</>));
        }
      }
    }
  };

  return (
    <div id="evaluator-panel">
      <div className="panel-actions">
        {crashButton}
      </div>
      <h1>Evaluator</h1>
      <div id="evaluator">
        <div id="expression" className="code">
          {state.expression && state.expression.evaluatorify(state, dispatch, callbacks)}
        </div>
      </div>
    </div>
  );
};

export default Evaluator;
