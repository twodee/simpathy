import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import StackFrame from './StackFrame';

import {
  declareVariableRightly,
  declareVariableWrongly,
  pushFrameRightly,
  pushFrameWrongly,
  popFrameRightly,
  popFrameWrongly,
  stopShaking,
} from '../actions';

import {
  Mode,
} from '../constants';

const Stack = () => {
  const stack = useSelector(state => state.memory.stack);
  const mode = useSelector(state => state.mode);
  const isBadDeclareVariable = useSelector(state => state.isBadDeclareVariable);
  const isBadPushFrame = useSelector(state => state.isBadPushFrame);
  const isBadPopFrame = useSelector(state => state.isBadPopFrame);
  const dispatch = useDispatch();

  let declareVariableAttributes = {
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
  const declareVariableButton = React.createElement('button', declareVariableAttributes, 'declare variable');

  let pushFrameAttributes = {
    className: isBadPushFrame ? 'shaking' : '',
    onClick: () => {
      if (mode === Mode.PushingFrame) {
        dispatch(pushFrameRightly());
      } else {
        dispatch(pushFrameWrongly());
      }
    },
    onAnimationEnd: () => dispatch(stopShaking()),
  };
  const pushFrameButton = React.createElement('button', pushFrameAttributes, 'push frame');

  let popFrameAttributes = {
    className: isBadPopFrame ? 'shaking' : '',
    onClick: () => {
      if (mode === Mode.PoppingFrame) {
        dispatch(popFrameRightly());
      } else {
        dispatch(popFrameWrongly());
      }
    },
    onAnimationEnd: () => dispatch(stopShaking()),
  };
  const popFrameButton = React.createElement('button', popFrameAttributes, 'pop frame');

  return (
    <div id="stack-panel">
      <div className="panel-actions">
        {declareVariableButton} &middot; {pushFrameButton} &middot; {popFrameButton}
      </div>
      <h1>
        Stack
      </h1>
      <div id="stack-frames">
        { stack.map((frame, i) => <StackFrame key={`${frame.name}-${i}`} index={stack.length - 1 - i} />) }
      </div>
    </div>
  );
};

export default Stack;
