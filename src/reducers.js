import { combineReducers } from 'redux';
import { Action } from './actions';

const initialState = {
  evaluator: {
    expression: null,
    hoveredSubexpression: null,
    activeSubexpression: null,
    value: '',
    isShakingOperation: false,
    isShakingEvaluation: false,
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
    case Action.EditValue:
      return {
        ...state,
        value: action.payload,
      };
    case Action.SelectSubexpression:
      return {
        ...state,
        activeSubexpression: action.payload,
        hoveredSubexpression: null,
        isEvaluating: true,
      };
    case Action.StartShakingOperation:
      return {
        ...state,
        activeSubexpression: action.payload,
        hoveredSubexpression: null,
        isShakingOperation: true,
        isEvaluating: false,
      };
    case Action.StopShakingOperation:
      return {
        ...state,
        activeSubexpression: null,
        isShakingOperation: false,
      };
    case Action.EvaluateCorrectly:
      return {
        ...state,
        activeSubexpression: null,
        isEvaluating: false,
        value: '',
        expression: state.expression.simplify(state.activeSubexpression, action.payload),
      };
    case Action.EvaluateIncorrectly:
      return {
        ...state,
        isShakingEvaluation: true,
      };
    case Action.StopShakingEvaluation:
      return {
        ...state,
        isShakingEvaluation: false,
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
