import React from 'react';
import { connect } from 'react-redux';

import './App.css';

import Prompter from './components/Prompter';
import Program from './components/Program';
import Evaluator from './components/Evaluator';
import Memory from './components/Memory';
import { lex } from './lexer';
import { parse } from './parser';

import {
  loadProgram,
} from './actions';

import {
  ExpressionBoolean,
  TreeStepper,
} from './ast';

class App extends React.Component {
  componentDidMount() {
    const tokens = lex(`print(5 + 6)
if a > 5
  if a > 2
    !true
    3
    print(max(5, 3))
  else
    print("foo")
  7 * 8
else
  9 / 3
9 + 2
a = 7 << 1`);
    const ast = parse(tokens);

    let stepper = new TreeStepper(ast);
    
    let next = stepper.next(new ExpressionBoolean(true));
    while (next) {
      console.log(next);
      next = stepper.next(new ExpressionBoolean(true));
    }
    
    // console.log("stepper.next(0):", stepper.next(0));
    // console.log("stepper.next(0):", stepper.next(0));
    // console.log("stepper.next(0):", stepper.next(0));
    // console.log("stepper.next(0):", stepper.next(0));

    this.props.onLoadProgram(ast);
  }

  render() {
    return (
      <div className="App">
        <Prompter />
        <Program />
        <Evaluator />
        <Memory />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onLoadProgram: program => {
      dispatch(loadProgram(program));
    },
  };
};

App = connect(mapStateToProps, mapDispatchToProps)(App);

export default App;
