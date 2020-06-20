import React from 'react';
import { Action } from './actions';

import {
  ExpressionAssignment,
  ExpressionInteger,
  ExpressionString,
  ExpressionPrint,
  ExpressionPrintLine,
  ExpressionReadLine,
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
  output: <></>,

  statementStack: [],
  activeStatement: null,
  clickedElement: null,
  hoveredElement: null,
  expectedElement: null,
  activeElement: null,
  isBadSelection: null,
  isBadInput: null,
  isBadEnterInput: false,
  isBadDeclareVariable: false,
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
          newState.mode = Mode.DeclaringVariable;
        }
      } else {
        const isPrint = action.payload instanceof ExpressionPrint || action.payload instanceof ExpressionPrintLine;
        if (isPrint) {
          newState.output = <>{state.output}<span className="output-text">{action.payload.output}</span></>;
          newState.feedback = <>The <code className="code prompt-code">{action.payload.name}</code> command has sent its output to <span className="panel-name">CONSOLE</span>.</>;
        }

        const isReadLine = action.payload instanceof ExpressionReadLine;
        if (isReadLine) {
          newState.objective = <>The <code className="code prompt-code">readLine</code> command gets text from the user. What text shall the user enter?</>;
          newState.mode = Mode.EnteringUserInput;
        } else {
          newState.objective = <>What is the value of <code className="code prompt-code">{action.payload.promptify(false)}</code>?</>;
          newState.mode = Mode.EvaluatingSubexpression;
        }
      }

      return newState;
    }

    case Action.EnterUserInput: {
      const simplifiedExpression = state.expression.simplify(state.activeSubexpression, action.payload);

      const newState = {
        ...state,
        activeSubexpression: null,
        currentInput: '',
        expression: simplifiedExpression,
        output: <>{state.output}<span className="input-text">{action.payload.value + '\n'}</span></>,
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
        isBadDeclareVariable: false,
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
        feedback: <>Yes, that's the variable's name.</>,
        objective: <>What happens next to execute this assignment?</>,
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

    case Action.DeclareVariableRightly:
      const newVariable = {
        name: '',
        current: new ExpressionUndefined(),
        history: [],
      };

      const topFrame = state.frames[state.frames.length - 1];

      return {
        ...state,
        isBadDeclareVariable: false,
        mode: Mode.NamingNewVariable,
        feedback: <>Yes, we declare a new variable.</>,
        objective: <>What is the variable's name?</>,
        frames: [...state.frames.slice(0, state.frames.length - 1), {
          name: topFrame.name,
          variables: [newVariable, ...topFrame.variables]
        }],
      };

    case Action.DeclareVariableWrongly:
      return {
        ...state,
        feedback: <>No, we don't need a new variable right now.</>,
        isBadDeclareVariable: true,
      };

    default:
      return state;
  }
}
