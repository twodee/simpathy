import React from 'react';
import { useSelector } from 'react-redux';

const Prompter = () => {
  const message = useSelector(state => state.message);
  return (
    <div id="prompter">
      <div id="message">{message}</div>
    </div>
  );
}

export default Prompter;
