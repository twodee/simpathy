import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import StackFrame from './StackFrame';

import {
  pushFrameRightly,
  pushFrameWrongly,
  stopShaking,
} from '../actions';

import {
  Mode,
} from '../constants';

const Stack = () => {
  const stack = useSelector(state => state.memory.stack);
  const mode = useSelector(state => state.mode);
  const isBadPushFrame = useSelector(state => state.isBadPushFrame);
  const dispatch = useDispatch();

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
  const pushFrameButton = React.createElement('button', pushFrameAttributes, 'push');

  return (
    <div id="stack-panel">
      <div className="panel-actions">
        {pushFrameButton}
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
