import { Action } from './actions';

import {
  ExpressionAssignment,
  ExpressionInteger,
  ExpressionLiteral,
  // ExpressionReal,
  ExpressionString,
} from './ast';

import {
  Mode, 
} from './constants';

const initialState = {
  mode: Mode.SelectingSubexpression,

  expression: null,
  program: null,

  activeStatement: null,
  clickedElement: null,
  hoveredElement: null,
  expectedElement: null,
  activeElement: null,
  isBadSelection: null,
  isBadInput: null,

  activeSubexpression: null,
  currentInput: '',

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
    case Action.LoadProgram:
      return {
        ...state,
        mode: Mode.SelectingStatement,
        message: 'The program has been loaded. What happens next?',
        program: action.payload,
      };
    case Action.EditInput:
      return {
        ...state,
        currentInput: action.payload,
      };
    case Action.SelectRightSubexpression:
      const isAssignment = action.payload instanceof ExpressionAssignment;
      return {
        ...state,
        isBadSelection: false,
        message: isAssignment ? 'what memory cell?' : 'what next?',
        activeSubexpression: action.payload,
        hoveredElement: null,
        mode: isAssignment ? Mode.SelectingMemoryValue : Mode.EvaluatingSubexpression,
      };
    case Action.SelectWrongSubexpression:
      return {
        ...state,
        message: "No, that's not it.",
        clickedElement: action.payload,
        hoveredElement: null,
        isBadSelection: true,
      };

    case Action.StopShaking:
      return {
        ...state,
        clickedElement: null,
        isBadSelection: false,
        isBadInput: false,
      };

    case Action.EnterRightSubexpressionValue: {
      const simplifiedExpression = state.expression.simplify(state.activeSubexpression, action.payload);
      const isPrimitive = simplifiedExpression instanceof ExpressionLiteral;
     
      let mode;
      let message;
      if (isPrimitive && state.activeStatement.getNextStatement(simplifiedExpression) === null) {
        mode = Mode.Celebrating;
        message = "You are all done!";
      } else if (isPrimitive) {
        mode = Mode.SelectingStatement;
        message = "next statement?";
      } else {
        mode = Mode.SelectingSubexpression;
        message = "next expression?";
      }
      
      return {
        ...state,
        isBadInput: false,
        activeSubexpression: null,
        mode: mode,
        message: message,
        currentInput: '',
        expression: simplifiedExpression,
      };
    }

    case Action.EnterWrongSubexpressionValue:
      return {
        ...state,
        isBadInput: true,
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
        isBadSelection: false,
        mode: Mode.EnteringMemoryValue,
      };

    case Action.SelectWrongMemoryValue:
      return {
        ...state,
        message: `No, that's variable ${action.payload.name}.`,
        clickedElement: action.payload,
        hoveredElement: null,
        isBadSelection: true,
      };

    case Action.SelectRightStatement:
      return {
        ...state,
        activeStatement: action.payload,
        expression: action.payload.clone(),
        message: 'Let\'s evaluate.',
        isBadSelection: false,
        mode: Mode.SelectingSubexpression,
      };

    case Action.SelectWrongStatement:
      return {
        ...state,
        message: `No, that's not what happens next.`,
        clickedElement: action.payload,
        hoveredElement: null,
        isBadSelection: true,
      };

    case Action.EnterRightMemoryValue: {
      const topFrame = state.frames[0];
      const simplifiedExpression = state.expression.simplify(state.activeSubexpression, state.activeSubexpression.value);
      const isPrimitive = simplifiedExpression instanceof ExpressionLiteral;

      let mode;
      let message;
      if (isPrimitive && state.activeStatement.getNextStatement(simplifiedExpression) === null) {
        mode = Mode.Celebrating;
        message = "You are all done!";
      } else if (isPrimitive) {
        mode = Mode.SelectingStatement;
        message = "next statement?";
      } else {
        mode = Mode.SelectingSubexpression;
        message = "next expression?";
      }

      return {
        ...state,
        isBadInput: false,
        currentInput: '',
        message: message,
        mode: mode,
        expression: simplifiedExpression,
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
    }

    case Action.EnterWrongMemoryValue:
      return {
        ...state,
        message: "That's not the right value.",
        isBadInput: true,
      };

    default:
      return state;
  }
}
