import { Action } from './actions';

import {
  ExpressionInteger,
  // ExpressionReal,
  ExpressionString,
} from './ast';

import {
  Mode, 
} from './constants';

const initialState = {
  mode: Mode.SelectingSubexpression,
  expression: null,

  hoveredElement: null,
  expectedElement: null,
  activeElement: null,
  isShaking: null,

  activeSubexpression: null,
  currentInput: '',

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
          history: [],
        }
      ],
    },
    {
      name: 'foo',
      variables: [
        {
          name: 'a',
          current: new ExpressionString("barm"),
          history: [],
        },
        {
          name: 'b',
          current: new ExpressionString("barm"),
          history: [],
        },
        {
          name: 'c',
          current: new ExpressionString("furb"),
          history: [],
        },
      ],
    },
  ]
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case Action.Hover:
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
    case Action.EditInput:
      return {
        ...state,
        currentInput: action.payload,
      };
    case Action.SelectRightSubexpression:
      return {
        ...state,
        message: action.payload.message,
        activeSubexpression: action.payload.expression,
        hoveredElement: null,
        mode: Mode.EvaluatingSubexpression,
      };
    case Action.SelectWrongSubexpression:
      return {
        ...state,
        message: action.payload.message,
        activeSubexpression: action.payload.expression,
        hoveredElement: null,
        isShaking: true,
      };
    case Action.StopShakingOperation:
      return {
        ...state,
        activeSubexpression: null,
        isShaking: false,
      };
    case Action.EnterRightSubexpressionValue:
      return {
        ...state,
        activeSubexpression: null,
        mode: Mode.SelectingSubexpression,
        currentInput: '',
        expression: state.expression.simplify(state.activeSubexpression, action.payload),
      };
    case Action.EnterWrongSubexpressionValue:
      return {
        ...state,
        isShaking: true,
      };
    case Action.StopShakingEvaluation:
      return {
        ...state,
        isShaking: false,
      };

    case Action.ShowMessage:
      return {
        ...state,
        message: action.payload,
      };

    case Action.SelectAssignment:
      return {
        ...state,
        message: 'Which value in memory is being assigned?',
        mode: Mode.SelectingMemoryValue,
        activeSubexpression: action.payload,
      };

    case Action.SelectRightMemoryValue:
      return {
        ...state,
        message: 'What\'s the new value of this variable?',
        mode: Mode.EnteringMemoryValue,
      };

    case Action.SelectWrongMemoryValue:
      return {
        ...state,
        message: `No, that's variable ${action.payload.name}.`,
        activeElement: action.payload,
        hoveredElement: null,
        isShaking: true,
      };

    case Action.StopShakingMemoryValueSelection:
      return {
        ...state,
        activeElement: null,
        isShaking: false,
      };

    case Action.EnterRightMemoryValue:
      const topFrame = state.frames[0];
      return {
        ...state,
        message: "You got it!",
        currentInput: '',
        mode: Mode.SelectingSubexpression,
        expression: state.expression.simplify(state.activeSubexpression, state.activeSubexpression.value),
        frames: [{
          name: topFrame.name,
          variables: topFrame.variables.map(variable => {
            if (variable.name === state.activeSubexpression.identifier.source) {
              return {
                name: variable.name,
                current: state.activeSubexpression.value,
                history: [variable.current].concat(variable.history),
              };
            } else {
              return variable;
            }
          }),
        }].concat(state.frames.slice(1)),
      };

    case Action.EnterWrongMemoryValue:
      return {
        ...state,
        message: "That's not the right value.",
        isShaking: true,
      };

    case Action.StopShakingMemoryValueInput:
      return {
        ...state,
        isShaking: false,
      };

    default:
      return state;
  }
}
