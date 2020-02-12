import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import './App.css';

import Prompter from './components/Prompter';
import Program from './components/Program';
import Evaluator from './components/Evaluator';
import Stack from './components/Stack';
import Console from './components/Console';

import { loadProgram } from './actions';
import { lex } from './lexer';
import { parse } from './parser';

function getAst() {
  const source = `while a < 3
  print(a)
  a = a + 1`;
  // const source = `print(62)
// println(78)
// print(54)
// d = 3
// print(5 + 6)
// 0
// if a > 5
  // if a > 2
    // !true
    // 3 + 2
    // print(max(5, 3))
  // else
    // print("foo")
  // 7 * 8
// else
  // 9 / 3
  // 9 + 2
// a = 7 << 1`;
  const tokens = lex(source);
  const ast = parse(tokens);
  return ast;
}

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadProgram(getAst()));
  }, [dispatch]);

  return (
    <div className="App">
      <div id="top-panel">
        <Prompter />
      </div>
      <div id="top-bottom-separator"></div>
      <div id="bottom-panel">
        <div id="left-panel">
          <Program />
          <div id="program-console-separator"></div>
          <Console />
        </div>
        <div id="left-right-separator"></div>
        <div id="right-panel">
          <Evaluator />
          <div id="evaluator-memory-separator"></div>
          <div id="memory-panel">
            <Stack />
            <div id="stack-heap-separator"></div>
            <div id="heap-panel">
              <h1>Heap</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
