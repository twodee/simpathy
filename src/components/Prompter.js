import React from 'react';
import { useSelector } from 'react-redux';

const Prompter = () => {
  const feedback = useSelector(state => state.feedback);
  const objective = useSelector(state => state.objective);
  return (
    <div id="prompter-panel">
      <div id="message">{feedback} {objective}</div>
    </div>
  );
}

export default Prompter;
