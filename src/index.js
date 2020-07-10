import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import store from './store';
import {Provider} from 'react-redux';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <Switch>
        <Route path="/custom">
          <App />
        </Route>
        <Route path="/:programId">
          <App />
        </Route>
        <Route path="*">
          <App />
        </Route>
      </Switch>
    </Router>
  </Provider>,
  document.getElementById('root')
);
