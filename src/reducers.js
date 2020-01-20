import { combineReducers } from 'redux';
import { Action } from './actions';

const initialState = {
  expression: null,
  hoveredSubexpression: null,
  activeSubexpression: null,
  value: '',
  isShakingOperation: false,
  isShakingEvaluation: false,
  message: null,
  frames: [
    {
      name: 'main',
      variables: [
        {
          name: 'a',
          current: 6,
          history: [7, 8, 9],
        }
      ],
    },
    {
      name: 'foo',
      variables: [
        {
          name: 'b',
          current: "barm",
          history: ["zig", "zag", "asd", "asdfadsf", "a2r23", "23432", "fghfgh", "asdfds", "ertert", "tyutyu", "vbvncvb", "thjrtyrt", "34543543", "23432423423423432", "cxvxfgf", "srtert"],
        },
        {
          name: 'c',
          current: "furb",
          history: ["zig", "zag"],
        },
      ],
    },
  ]
};

export default function reducer(state = initialState, action) {
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

    case Action.ShowMessage:
      return {
        ...state,
        message: action.payload,
      };

    default:
      return state;
  }
}

// const reducer = combineReducers({evaluator, prompter, memory});

// export default reducer;
