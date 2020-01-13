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
  ExpressionInteger,
  ExpressionMultiply,
  ExpressionReal,
} from './ast';

class App extends React.Component {
  componentDidMount() {
    const e = new ExpressionAdd(new ExpressionInteger(7), new ExpressionMultiply(new ExpressionReal(1.5), new ExpressionInteger(9)));
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
