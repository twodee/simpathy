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
  const source = `a = b = 3`;

  // const source = `// Print a bunch of stuff
// print(format("%05.2f->", 3.785, "foo"))`;

  // const source = `parseInt("foo")`;

  // const source = `function gcd(a, b)
  // big = max(a, b)
  // small = min(a, b)
  // while small != 0
    // tmp = small
    // small = big % small
    // big = tmp
  // return big
// print(gcd(9, 10))`;

  // const source = `function gcd(a, b)
  // Order a and b.
  // big = max(a, b)
  // small = min(a, b)
  // while small != 0
    // tmp = small
    // small = big % small
    // big = tmp
  // return big

// 5 + 7
// x = parseInt(readLine())
// y = parseIns(readLine())
// print(gcd(x, y))`;

  // const source = `a = 5`;

  // const source = `print(5)
// print(5 - 7)
// 8 * 9 > 70`;

  // const source = `function double(x)
  // return 2 * x
// print(double(5))
// sum = 5 - (4 + 1)`;

// x = parseInt(readLine())
// while (x > 0)
  // sum = sum + x
  // x = parseInt(readLine())`;
  // const source = `while a < 3
  // println(a + 3)
  // a = a + 1`;
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

  const programConsoleResizer = React.createRef();
  const evaluatorMemoryResizer = React.createRef();
  const leftRightResizer = React.createRef();
  const stackHeapResizer = React.createRef();

  const onStartVerticalDragging = (resizer) => {
    const onMouseMove = e => {
      const element = resizer.current;
      const parentPanel = element.parentNode;
      const bounds = element.parentNode.getBoundingClientRect();
      const proportion = (e.clientY - bounds.y) / bounds.height;
      parentPanel.children[0].style['flex-grow'] = proportion;
      parentPanel.children[2].style['flex-grow'] = 1 - proportion;
      e.preventDefault();
    };

    const onMouseDown = e => {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', onMouseMove);
      });
      e.preventDefault();
    };

    return onMouseDown;
  }

  const onStartHorizontalDragging = (resizer) => {
    const onMouseMove = e => {
      const element = resizer.current;
      const parentPanel = element.parentNode;
      const bounds = element.parentNode.getBoundingClientRect();
      const proportion = (e.clientX - bounds.x) / bounds.width;
      parentPanel.children[0].style['flex-grow'] = proportion;
      parentPanel.children[2].style['flex-grow'] = 1 - proportion;
      e.preventDefault();
    };

    const onMouseDown = e => {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', onMouseMove);
      });
      e.preventDefault();
    };

    return onMouseDown;
  }


  return (
    <div className="App">
      <div id="top-panel">
        <Prompter />
      </div>
      <div
        id="top-bottom-separator"
      ></div>
      <div id="bottom-panel">
        <div id="left-panel">
          <Program />
          <div
            id="program-console-separator"
            ref={programConsoleResizer}
            onMouseDown={onStartVerticalDragging(programConsoleResizer)}
          ></div>
          <Console />
        </div>
        <div
          id="left-right-separator"
          ref={leftRightResizer}
          onMouseDown={onStartHorizontalDragging(leftRightResizer)}
        ></div>
        <div id="right-panel">
          <Evaluator />
          <div
            id="evaluator-memory-separator"
            ref={evaluatorMemoryResizer}
            onMouseDown={onStartVerticalDragging(evaluatorMemoryResizer)}
          ></div>
          <div id="memory-panel">
            <Stack />
            <div
              id="stack-heap-separator"
              ref={stackHeapResizer}
              onMouseDown={onStartHorizontalDragging(stackHeapResizer)}
            ></div>
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
