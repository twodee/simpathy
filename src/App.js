import React from 'react';
import { connect } from 'react-redux';

import './App.css';

import Prompter from './components/Prompter';
import Code from './components/Code';
import Evaluator from './components/Evaluator';
import Memory from './components/Memory';
import { lex } from './lexer';
import { parse } from './parser';

import {
  loadExpression,
  showMessage,
} from './actions';

// import {
  // ExpressionAdd,
  // ExpressionAnd,
  // ExpressionBoolean,
  // ExpressionDivide,
  // ExpressionInteger,
  // ExpressionModulus,
  // ExpressionMultiply,
  // ExpressionNot,
  // ExpressionOr,
  // ExpressionReal,
// } from './ast';

class App extends React.Component {
  componentDidMount() {
    const tokens = lex('5 << 2 >> 3').slice(1);
    const e = parse(tokens);
    this.props.onLoadExpression(e);
  }

  render() {
    return (
      <div className="App">
        <Prompter />
        <Code />
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
    onLoadExpression: expr => {
      dispatch(showMessage('Click on the next expression to be evaluated.'));
      dispatch(loadExpression(expr));
    },
  };
};

App = connect(mapStateToProps, mapDispatchToProps)(App);

export default App;
