import React from 'react';
import { useSelector } from 'react-redux';

import {
} from '../actions';

import {
  Mode,
} from '../constants';

const Console = () => {
  const output = useSelector(state => state.output);

  return (
    <div id="console">{output}</div>
  );
};

export default Console;
