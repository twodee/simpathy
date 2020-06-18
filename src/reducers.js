import React from 'react';
import { Action } from './actions';

import {
  ExpressionAssignment,
  ExpressionInteger,
  // ExpressionReal,
  ExpressionString,
  ExpressionPrint,
  ExpressionPrintln,
  ExpressionUnit,
  ExpressionUndefined,
  TreeStepper,
} from './ast';

import {
  Mode, 
} from './constants';

const initialState = {
  mode: Mode.SelectingSubexpression,

  expression: null,
  program: null,
  output: '',

  statementStack: [],
  activeStatement: null,
  clickedElement: null,
  hoveredElement: null,
  expectedElement: null,
  activeElement: null,
  isBadSelection: null,
  isBadInput: null,
  isStatementEvaluated: false,

  activeSubexpression: null,
  currentInput: '',

  objective: null,
  feedback: null,

  frames: [
    {
      name: 'main',
      variables: [
        {
          name: 'fff',
          current: new ExpressionUndefined(),
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
          current: new ExpressionInteger(0),
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
          feedback: <><span className="panel-name">PROGRAM</span> is loaded.</>,
          objective: <>What code is evaluated first?</>,
          program: action.payload,
          astStepper: astStepper,
          activeStatement: nextStatement,
        };
      } else {
        return {
          ...state,
          objective: <>This program doesn't have anything in it! There's nothing to do.</>,
          mode: Mode.Celebrating,
        };
      }
    case Action.EditInput:
      return {
        ...state,
        currentInput: action.payload,
      };
    case Action.SelectRightSubexpression: {
      const newState = {
        ...state,
        isBadSelection: false,
        activeSubexpression: action.payload,
        hoveredElement: null,
        feedback: null,
      };

      const isAssignment = action.payload instanceof ExpressionAssignment;
      if (isAssignment) {
        const hasVariable = state.frames[state.frames.length - 1].variables.some(variable => variable.name === action.payload.identifier.source);

        newState.objective = <>What happens in memory to execute this assignment?</>;
        if (hasVariable) {
          newState.mode = Mode.SelectingMemoryValue;
        } else {
          newState.mode = Mode.AddingNewVariable;
        }
      } else {
        const isPrint = action.payload instanceof ExpressionPrint || action.payload instanceof ExpressionPrintln;
        if (isPrint) {
          newState.output = state.output + action.payload.output;
          newState.feedback = <>The <code className="code prompt-code">{action.payload.name}</code> command has sent some output to <span className="panel-name">CONSOLE</span>.</>;
        }

        newState.objective = <>What is the value of <code className="code prompt-code">{action.payload.promptify(false)}</code>?</>;
        newState.mode = Mode.EvaluatingSubexpression;
      }

      return newState;
    }

    case Action.SelectWrongSubexpression: {
      const newState = {
        ...state,
        clickedElement: action.payload,
        hoveredElement: null,
        isBadSelection: true,
      };

      if (action.payload.isSimplified()) {
        newState.feedback = <>No, <code className="code prompt-code">{action.payload.promptify(false)}</code> is a primitive and can't be evaluated further.</>;
      } else {
        newState.feedback = <>No, we'll evaluate <code className="code prompt-code">{action.payload.promptify(false)}</code> soon, but not yet.</>;
      }

      return newState;
    }

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

      const newState = {
        ...state,
        isBadInput: false,
        activeSubexpression: null,
        currentInput: '',
        expression: simplifiedExpression,
      };

      if (simplifiedExpression.isSimplified()) {
        newState.activeStatement = state.astStepper.next(simplifiedExpression);
        newState.isStatementEvaluated = true;
      }
     
      if (!newState.activeStatement) {
        newState.mode = Mode.Celebrating;
        newState.feedback = null;
        newState.objective = "You are all done!";
      } else if (simplifiedExpression.isSimplified()) {
        newState.mode = Mode.SelectingStatement;
        newState.feedback = <>You've whittled <code className="code prompt-code">{state.activeStatement.promptify(false)}</code> down to <code className="code prompt-code">{simplifiedExpression.promptify(false)}</code>, a primitive.</>;
        newState.objective = <>What code in <span className="panel-name">PROGRAM</span> is evaluated next?</>;
      } else {
        newState.mode = Mode.SelectingSubexpression;
        newState.feedback = "That's right.";
        newState.objective = "What subexpression is evaluated next?";
      }
      
      return newState;
    }

    case Action.EnterWrongSubexpressionValue:
      return {
        ...state,
        isBadInput: true,
      };

    case Action.SelectAssignment:
      return {
        ...state,
        feedback: null,
        objective: 'Which value in memory is being assigned?',
        mode: Mode.SelectingMemoryValue,
        activeSubexpression: action.payload,
      };

    case Action.SelectRightMemoryValue:
      return {
        ...state,
        feedback: <>Yes, we must update variable <code className="code prompt-code">{state.activeSubexpression.identifier.source}</code>.</>,
        objective: <>What's the new value of <code className="code prompt-code">{state.activeSubexpression.identifier.source}</code>?</>,
        isBadSelection: false,
        mode: Mode.EnteringMemoryValue,
      };

    case Action.SelectWrongMemoryValue:
      return {
        ...state,
        feedback: <>No, we're not updating variable <code className="code prompt-code">{action.payload.name}</code> right now.</>,
        clickedElement: action.payload,
        hoveredElement: null,
        isBadSelection: true,
      };

    case Action.SelectRightStatement: {
      let expression = action.payload;

      const newState = {
        ...state,
        isBadSelection: false,
      };

      if (state.isStatementEvaluated) {
        Object.assign(newState, {
          statementStack: state.statementStack.filter((statement, i) => i < state.statementStack.length - 1),
          isStatementEvaluated: false,
        });
      }

      if (expression.isSimplified()) {
        let nextStatement = state.astStepper.next(new ExpressionUnit());
        if (nextStatement) {
          Object.assign(newState, {
            activeStatement: nextStatement ? nextStatement : state.activeStatement,
            feedback: null,
            objective: 'What\'s the next statement?',
            mode: Mode.SelectingStatement,
          });
        } else {
          Object.assign(newState, {
            activeStatement: null,
            feedback: 'You did did did it!',
            objective: null,
            mode: Mode.Celebrating,
          });
        }
      } else {
        Object.assign(newState, {
          expression: expression.clone(),
          feedback: <>That's right. Let's whittle <code className="code prompt-code">{state.activeStatement.promptify(false)}</code> down in <span className="panel-name">EVALUATOR</span>.</>,
          objective: <>What subexpression is evaluated first?</>,
          mode: Mode.SelectingSubexpression,
          statementStack: [...newState.statementStack, state.activeStatement],
          isStatementEvaluated: false,
        });
      }

      return newState;
    }

    case Action.SelectWrongStatement:
      return {
        ...state,
        feedback: `No, that code is not executed next.`,
        clickedElement: action.payload,
        hoveredElement: null,
        isBadSelection: true,
      };

    case Action.EnterRightMemoryValue: {
      const topFrame = state.frames[state.frames.length - 1];
      const simplifiedExpression = state.expression.simplify(state.activeSubexpression, state.activeSubexpression.value);

      const newState = {
        ...state,
        isBadInput: false,
        currentInput: '',
        expression: simplifiedExpression,
        frames: [...state.frames.slice(0, state.frames.length - 1), {
          name: topFrame.name,
          variables: topFrame.variables.map(variable => {
            if (variable.name === state.activeSubexpression.identifier.source) {
              return {
                name: variable.name,
                current: state.activeSubexpression.value,
                history: variable.current instanceof ExpressionUndefined ? variable.history : [variable.current].concat(variable.history),
              };
            } else {
              return variable;
            }
          }),
        }],
      };

      if (simplifiedExpression.isSimplified()) {
        Object.assign(newState, {
          activeStatement: state.astStepper.next(simplifiedExpression),
          isStatementEvaluated: true,
        });
      }

      if (!newState.activeStatement) {
        newState.mode = Mode.Celebrating;
        newState.feedback = null;
        newState.objective = "You are all done!";
      } else if (simplifiedExpression.isSimplified()) {
        newState.mode = Mode.SelectingStatement;
        newState.feedback = <>You've whittled <code className="code prompt-code">{state.activeStatement.promptify(false)}</code> down to <code className="code prompt-code">{simplifiedExpression.promptify(false)}</code>, a primitive.</>;
        newState.objective = <>What code in <span className="panel-name">PROGRAM</span> is evaluated next?</>;
      } else {
        newState.mode = Mode.SelectingSubexpression;
        newState.feedback = null;
        newState.objective = "next expression?";
      }

      return newState;
    }

    case Action.EnterRightVariableName: {
      const topFrame = state.frames[state.frames.length - 1];
      return {
        ...state,
        isBadInput: false,
        currentInput: '',
        feedback: <>That's the right name!</>,
        mode: Mode.SelectingMemoryValue,
        frames: [...state.frames.slice(0, state.frames.length - 1), {
          name: topFrame.name,
          variables: [{
            name: state.activeSubexpression.identifier.source,
            current: topFrame.variables[0].current,
            history: topFrame.variables[0].history,
          }, ...topFrame.variables.slice(1)],
        }],
      };
    }

    case Action.EnterWrongVariableName:
      return {
        ...state,
        feedback: "That's not the right name.",
        isBadInput: true,
      };


    case Action.EnterWrongMemoryValue:
      return {
        ...state,
        feedback: action.payload,
        isBadInput: true,
      };

    case Action.AddNewVariableRightly:
      const newVariable = {
        name: '',
        current: new ExpressionUndefined(),
        history: [],
      };

      const topFrame = state.frames[state.frames.length - 1];

      return {
        ...state,
        isBadAddNewVariable: false,
        mode: Mode.NamingNewVariable,
        frames: [...state.frames.slice(0, state.frames.length - 1), {
          name: topFrame.name,
          variables: [newVariable, ...topFrame.variables]
        }],
      };

    case Action.AddNewVariableWrongly:
      return {
        ...state,
        feedback: <>No, we don't need a new variable right now.</>,
        isBadAddNewVariable: true,
      };

    default:
      return state;
  }
}
