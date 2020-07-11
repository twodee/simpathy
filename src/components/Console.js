import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  editInput,
  enterUserInput,
} from '../actions';

import {
  Mode,
} from '../constants';

import {
  ExpressionString,
} from '../ast';

const Console = () => {
  const dispatch = useDispatch();
  const output = useSelector(state => state.output);
  const mode = useSelector(state => state.mode);
  const currentInput = useSelector(state => state.currentInput);

  const attributes = {
    className: 'user-input-box',
    type: 'text',
    autoFocus: true,
    value: currentInput,
    onChange: e => dispatch(editInput(e.target.value)),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        dispatch(enterUserInput(new ExpressionString(currentInput)));
      }
    },
  };
  const input = React.createElement('input', attributes);

  return (
    <div id="console-panel">
      <h1>Console</h1>
      <div id="console">
        {output}
        {mode === Mode.EnteringUserInput && input}
      </div>
    </div>
  );
};

export default Console;
