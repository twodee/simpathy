import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import StackFrame from './StackFrame';

import {
  declareVariableRightly,
  declareVariableWrongly,
  stopShaking,
} from '../actions';

import {
  Mode,
} from '../constants';

const Stack = () => {
  const frames = useSelector(state => state.frames);
  const mode = useSelector(state => state.mode);
  const isBadDeclareVariable = useSelector(state => state.isBadDeclareVariable);
  const dispatch = useDispatch();

  let attributes = {
    className: isBadDeclareVariable ? 'shaking' : '',
    onClick: () => {
      if (mode === Mode.DeclaringVariable) {
        dispatch(declareVariableRightly());
      } else {
        dispatch(declareVariableWrongly());
      }
    },
    onAnimationEnd: () => dispatch(stopShaking()),
  };
  const declareVariableButton = React.createElement('button', attributes, 'declare variable');
  console.log("mode:", mode);

  return (
    <div id="stack-panel">
      <div className="panel-actions">
        {declareVariableButton} &middot; <button>pop frame</button>
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
