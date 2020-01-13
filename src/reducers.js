import { combineReducers } from 'redux';
import { Action } from './actions';

const initialState = {
  evaluator: {
    expression: null,
    hoveredSubexpression: null,
    activeSubexpression: null,
  },
  prompter: {
    message: null,
  }
};

function evaluator(state = initialState.evaluator, action) {
  switch (action.type) {
    case Action.HoverSubexpression:
      return {
        ...state,
        hoveredSubexpression: action.payload,
      };
    case Action.UnhoverSubexpression:
      return {
        ...state,
        hoveredSubexpression: state.hoveredSubexpression === action.payload ? null : state.hoveredSubexpression,
      };
    case Action.LoadExpression:
      return {
        ...state,
        expression: action.payload,
      };
    case Action.EvaluateSubexpression:
      return {
        ...state,
        activeSubexpression: action.payload,
      };
    default:
      return state;
  }
}

function prompter(state = initialState.prompter, action) {
  switch (action.type) {
    case Action.ShowMessage:
      return {
        ...state,
        message: action.payload,
      };
    default:
      return state;
  }
}

const reducer = combineReducers({ evaluator, prompter });

export default reducer;
