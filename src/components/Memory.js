import React from 'react';
import { useSelector } from 'react-redux';

import StackFrame from './StackFrame';

const Memory = () => {
  const frames = useSelector(state => state.frames);

  return (
    <div id="memory">
      <div id="frames">
        { frames.map((frame, i) => <StackFrame key={`${frame.name}-${i}`} index={i} />) }
      </div>
    </div>
  );
};

export default Memory;
