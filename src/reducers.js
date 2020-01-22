import { Action } from './actions';

import {
  ExpressionInteger,
  ExpressionReal,
  ExpressionString,
} from './ast';

import {
  Mode, 
} from './constants';

const initialState = {
  mode: Mode.SelectSubexpression,
  expression: null,

  hoveredElement: null,
  expectedElement: null,
  activeElement: null,
  isShaking: null,

  activeSubexpression: null,
  value: '',
  isShakingOperation: false,
  isShakingEvaluation: false,

  errorMessage: '',
  goalMessage: '',

  message: null,
  frames: [
    {
      name: 'main',
      variables: [
        {
          name: 'a',
          current: new ExpressionInteger(6),
          history: [7, 8, 9],
        }
      ],
    },
    {
      name: 'foo',
      variables: [
        {
          name: 'a',
          current: new ExpressionString("barm"),
          history: ["zig", "zag", "asd", "asdfadsf", "a2r23", "23432", "fghfgh", "asdfds", "ertert", "tyutyu", "vbvncvb", "thjrtyrt", "34543543", "23432423423423432", "cxvxfgf", "srtert"],
        },
        {
          name: 'b',
          current: new ExpressionString("barm"),
          history: ["zig", "zag", "asd", "asdfadsf", "a2r23", "23432", "fghfgh", "asdfds", "ertert", "tyutyu", "vbvncvb", "thjrtyrt", "34543543", "23432423423423432", "cxvxfgf", "srtert"],
        },
        {
          name: 'c',
          current: new ExpressionString("furb"),
          history: ["zig", "zag"],
        },
      ],
    },
  ]
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case Action.Hover:
      console.log("hovering");
      return {
        ...state,
        hoveredElement: action.payload,
      };
    case Action.Unhover:
      return {
        ...state,
        hoveredElement: state.hoveredElement === action.payload ? null : state.hoveredElement,
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
        hoveredElement: null,
        mode: Mode.EvaluateSubexpression,
      };
    case Action.StartShakingOperation:
      return {
        ...state,
        activeSubexpression: action.payload,
        hoveredElement: null,
        isShakingOperation: true,
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
        mode: Mode.SelectSubexpression,
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

    case Action.SelectMemoryValue:
      return {
        ...state,
        message: 'Which value in memory is being assigned?',
        mode: Mode.SelectMemoryValue,
        expectedElement: action.payload,
      };

    case Action.SelectRightMemoryValue:
      return {
        ...state,
        message: 'What\'s the new value of this variable?',
        mode: Mode.UpdateMemoryValue,
      };

    case Action.SelectWrongMemoryValue:
      return {
        ...state,
        message: `No, that's variable ${action.payload.name}.`,
        activeElement: action.payload,
        hoveredElement: null,
        isShaking: true,
      };

    case Action.StopShakingMemoryValue:
      return {
        ...state,
        activeElement: null,
        isShaking: false,
      };

    default:
      return state;
  }
}
