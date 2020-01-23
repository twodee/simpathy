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

class App extends React.Component {
  componentDidMount() {
    // const tokens = lex('a = 1 + 2 + 3').slice(1);
    // const e = parse(tokens);
    // this.props.onLoadExpression(e);

    const tokens = lex(`a = 7
a = 5 + 3
a = !false`);
    const ast = parse(tokens);
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
