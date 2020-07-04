import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  selectRightStatement,
  selectWrongStatement,
} from '../actions';

import {
  Mode,
} from '../constants';

// --------------------------------------------------------------------------- 

const Program = () => {
  const state = {
    statementStack: useSelector(state => state.statementStack),
    hoveredElement: useSelector(state => state.hoveredElement),
    clickedElement: useSelector(state => state.clickedElement),
    program: useSelector(state => state.program),
    mode: useSelector(state => state.mode),
    activeStatement: useSelector(state => state.activeStatement),
    isBadSelection: useSelector(state => state.isBadSelection),
    expression: useSelector(state => state.expression),
    statements: useSelector(state => state.statements),
    nextStatement: useSelector(state => state.nextStatement),
  };

  const dispatch = useDispatch();

  const callbacks = {
    onClick: clickedElement => {
      if (state.mode === Mode.SelectingStatement && state.nextStatement === clickedElement) {
        dispatch(selectRightStatement(clickedElement));
      } else {
        dispatch(selectWrongStatement(clickedElement));
      }
    },
  };

  return (
    <div id="program-panel">
      <h1>Program</h1>
      <div id="program" className="code">
        {state.program && state.program.programify(state, dispatch, callbacks, false, false, '')}
      </div>
    </div>
  );
};

export default Program;
