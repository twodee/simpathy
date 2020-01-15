import React from 'react';
import { connect } from 'react-redux';

import './App.css';

import Prompter from './components/Prompter';
import Code from './components/Code';
import Evaluator from './components/Evaluator';
import Memory from './components/Memory';

import {
  loadExpression,
  showMessage,
} from './actions';

import {
  ExpressionAdd,
  ExpressionAnd,
  ExpressionBoolean,
  ExpressionDivide,
  ExpressionInteger,
  ExpressionModulus,
  ExpressionMultiply,
  ExpressionNot,
  ExpressionOr,
  ExpressionReal,
} from './ast';

class App extends React.Component {
  componentDidMount() {
    // const e = new ExpressionAdd(new ExpressionInteger(7), new ExpressionAdd(new ExpressionReal(1.5), new ExpressionInteger(9)));
    // const e = new ExpressionMultiply(new ExpressionAdd(new ExpressionReal(1.5), new ExpressionInteger(9)), new ExpressionInteger(7));
    // const e = new ExpressionMultiply(new ExpressionInteger(7), new ExpressionAdd(new ExpressionReal(1.5), new ExpressionInteger(9)));
    // const e = new ExpressionMultiply(new ExpressionInteger(7), new ExpressionMultiply(new ExpressionReal(1.5), new ExpressionInteger(9)));
    // const e = new ExpressionMultiply(new ExpressionModulus(new ExpressionInteger(44), new ExpressionInteger(9)), new ExpressionInteger(7));
    const e = new ExpressionOr(new ExpressionAnd(new ExpressionBoolean(true), new ExpressionBoolean(false)), new ExpressionNot(new ExpressionAnd(new ExpressionBoolean(true), new ExpressionBoolean(true))));
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
