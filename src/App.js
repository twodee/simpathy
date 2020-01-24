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
    const tokens = lex(`a = max(sign(10), sign(0) + sign(-5))`);
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
