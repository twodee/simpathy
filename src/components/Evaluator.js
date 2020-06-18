import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  enterRightSubexpressionValue,
  enterWrongSubexpressionValue,
  selectRightSubexpression,
  selectWrongSubexpression,
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
    expression: useSelector(state => state.expression),
    currentInput: useSelector(state => state.currentInput),
    env: useSelector(state => state.frames[state.frames.length - 1]),
  };

  const dispatch = useDispatch();

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
        const expected = state.activeSubexpression.evaluate(state.env);
        let actual = parseLiteral(state.currentInput);

        if (expected.equals(actual)) {
          dispatch(enterRightSubexpressionValue(actual));
        } else {
          dispatch(enterWrongSubexpressionValue(actual));
        }
      }
    }
  };

  return (
    <div id="evaluator-panel">
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
