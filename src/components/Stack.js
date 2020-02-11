import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import StackFrame from './StackFrame';

import {
  addNewVariableRightly,
  addNewVariableWrongly,
  stopShaking,
} from '../actions';

import {
  Mode,
} from '../constants';

const Stack = () => {
  const frames = useSelector(state => state.frames);
  const mode = useSelector(state => state.mode);
  const isBadAddNewVariable = useSelector(state => state.isBadAddNewVariable);
  const dispatch = useDispatch();

  let attributes = {
    className: isBadAddNewVariable ? 'shaking' : '',
    onClick: () => {
      if (mode === Mode.AddingNewVariable) {
        dispatch(addNewVariableRightly());
      } else {
        dispatch(addNewVariableWrongly());
      }
    },
    onAnimationEnd: () => dispatch(stopShaking()),
  };
  const addNewVariableButton = React.createElement('button', attributes, 'add variable');

  return (
    <div id="stack-panel">
      <div id="stack-tools">
        {addNewVariableButton} &middot; <button>pop frame</button>
      </div>
      <h1>
        Stack
      </h1>
      <div id="stack-frames">
        { frames.map((frame, i) => <StackFrame key={`${frame.name}-${i}`} index={frames.length - 1 - i} />) }
      </div>
    </div>
  );
};

export default Stack;
