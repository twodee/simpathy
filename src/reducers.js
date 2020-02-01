import { Action } from './actions';

import {
  ExpressionAssignment,
  ExpressionInteger,
  // ExpressionReal,
  ExpressionString,
  ExpressionUnit,
  TreeStepper,
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
          name: 'fff',
          current: new ExpressionString('undefined'),
          history: [],
        },
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
      let astStepper = new TreeStepper(action.payload);

      let nextStatement = astStepper.next(new ExpressionUnit());
      if (nextStatement) {
        return {
          ...state,
          mode: Mode.SelectingStatement,
          message: 'The program has been loaded. What happens next?',
          program: action.payload,
          astStepper: astStepper,
          activeStatement: nextStatement,
        };
      } else {
        return {
          ...state,
          message: 'This program doesn\'t have anything in it!',
          mode: Mode.Celebrating,
        };
      }
    case Action.EditInput:
      return {
        ...state,
        currentInput: action.payload,
      };
    case Action.SelectRightSubexpression:
      const isAssignment = action.payload instanceof ExpressionAssignment;

      if (isAssignment) {
        const hasVariable = state.frames[state.frames.length - 1].variables.some(variable => variable.name === action.payload.identifier.source);

        if (hasVariable) {
          return {
            ...state,
            isBadSelection: false,
            message: 'what memory cell?',
            activeSubexpression: action.payload,
            hoveredElement: null,
            mode: Mode.SelectingMemoryValue,
          };
        } else {
          return {
            ...state,
            isBadSelection: false,
            message: 'what happens next?',
            hoveredElement: null,
            mode: Mode.AddingNewVariable,
          };
        }
      } else {
        return {
          ...state,
          isBadSelection: false,
          message: 'what next?',
          activeSubexpression: action.payload,
          hoveredElement: null,
          mode: Mode.EvaluatingSubexpression,
        };
      }
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
        isBadAddNewVariable: false,
      };

    case Action.EnterRightSubexpressionValue: {
      const simplifiedExpression = state.expression.simplify(state.activeSubexpression, action.payload);

      let nextStatement = null;
      if (simplifiedExpression.isSimplified()) {
        nextStatement = state.astStepper.next(simplifiedExpression);
      }
     
      let mode;
      let message;
      if (simplifiedExpression.isSimplified() && nextStatement === null) {
        mode = Mode.Celebrating;
        message = "You are all done!";
      } else if (simplifiedExpression.isSimplified()) {
        mode = Mode.SelectingStatement;
        message = "next statement?";
      } else {
        mode = Mode.SelectingSubexpression;
        message = "next expression?";
      }
      
      return {
        ...state,
        activeStatement: nextStatement ? nextStatement : state.activeStatement,
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
      let expression = action.payload;

      if (expression.isSimplified()) {
        let nextStatement = state.astStepper.next(new ExpressionUnit());
        if (nextStatement) {
          return {
            ...state,
            activeStatement: nextStatement ? nextStatement : state.activeStatement,
            message: 'What\'s the next statement?',
            isBadSelection: false,
            mode: Mode.SelectingStatement,
          };
        } else {
          return {
            ...state,
            activeStatement: null,
            message: 'You did did did it!',
            isBadSelection: false,
            mode: Mode.Celebrating,
          };
        }
      } else {
        return {
          ...state,
          expression: expression.clone(),
          message: 'Let\'s evaluate.',
          isBadSelection: false,
          mode: Mode.SelectingSubexpression,
        };
      }

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

      let nextStatement = null;
      if (simplifiedExpression.isSimplified()) {
        nextStatement = state.astStepper.next(simplifiedExpression);
      }

      let mode;
      let message;
      if (simplifiedExpression.isSimplified() && nextStatement === null) {
        mode = Mode.Celebrating;
        message = "You are all done!";
      } else if (simplifiedExpression.isSimplified()) {
        mode = Mode.SelectingStatement;
        message = "next statement?";
      } else {
        mode = Mode.SelectingSubexpression;
        message = "next expression?";
      }

      return {
        ...state,
        isBadInput: false,
        activeStatement: nextStatement ? nextStatement : state.activeStatement,
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

    case Action.AddNewVariableRightly:
      const newVariable = {
        name: '',
        current: new ExpressionString('undefined'),
        history: [],
      };

      const topFrame = state.frames[state.frames.length - 1];

      return {
        ...state,
        isBadAddNewVariable: false,
        frames: [...state.frames.slice(0, state.frames.length - 1), {
          name: topFrame.name,
          variables: [newVariable, ...topFrame.variables]
        }],
      };

    case Action.AddNewVariableWrongly:
      return {
        ...state,
        isBadAddNewVariable: true,
      };

    default:
      return state;
  }
}
