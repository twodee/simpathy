import React from 'react';
import { Action } from './actions';

import {
  ExpressionArray,
  ExpressionAssignment,
  ExpressionBoolean,
  ExpressionFunctionDefinition,
  ExpressionUserFunctionCall,
  ExpressionInteger,
  ExpressionLValue,
  ExpressionString,
  ExpressionPrint,
  ExpressionPrintLine,
  ExpressionReadLine,
  ExpressionReference,
  ExpressionReturn,
  ExpressionUnit,
  ExpressionUndefined,
  TreeStepper,
} from './ast';

import {
  Mode, 
} from './constants';

// --------------------------------------------------------------------------- 

class Stack {
  constructor(items = []) {
    this.items = items;
  }

  push(newItem) {
    return new Stack([...this.items, newItem]);
  }

  empty() {
    return this.items.length === 0;
  }

  indexOf(item) {
    return this.items.indexOf(item);
  }

  get size() {
    return this.items.length;
  }

  get top() {
    return this.items[this.items.length - 1];
  }

  get bottoms() {
    return new Stack(this.items.slice(0, this.items.length - 1));
  }
}

// --------------------------------------------------------------------------- 

const initialState = {
  mode: Mode.SelectingSubexpression,

  expression: null,
  program: null,
  output: <></>,

  steppers: new Stack(),
  statements: new Stack(),
  pausedExpressions: new Stack(),
  pausedActiveSubexpressions: new Stack(),

  nextStatement: null,
  clickedElement: null,
  hoveredElement: null,
  expectedElement: null,
  activeElement: null,
  isBadPushFrame: null,
  isBadPopFrame: null,
  isBadSelection: null,
  isBadInput: null,
  isBadEnterInput: false,
  isBadDeclareVariable: false,
  isBadCrash: false,
  isStatementEvaluated: false,
  isCrashing: false,

  expectedName: null,
  expectedValue: null,

  activeSubexpression: null,
  currentInput: '',
  parameterIndex: null,

  objective: null,
  feedback: null,

  memory: {
    stack: [
      {
        name: 'main',
        functions: {},
        variables: [
          {
            name: 'return',
            current: new ExpressionUndefined(),
            history: [],
          },
        ],
      },
    ],

    heap: {
      '@942': new ExpressionArray([
        new ExpressionInteger(6),
        new ExpressionString("dog"),
        new ExpressionBoolean(true),
        new ExpressionReference('@500'),
      ]),
      '@433': new ExpressionInteger(5),
      '@301': new ExpressionReference('@491'),
    },
  },
};

export default function reducer(state = initialState, action) {
  const newState = {
    ...state,
  };

  switch (action.type) {
    case Action.Hover: {
      Object.assign(newState, {
        hoveredElement: action.payload,
      });

      break;
    }

    case Action.Unhover: {
      Object.assign(newState, {
        hoveredElement: state.hoveredElement === action.payload ? null : state.hoveredElement,
      });

      break;
    }

    case Action.LoadExpression: {
      Object.assign(newState, {
        expression: action.payload,
      });

      break;
    }

    case Action.LoadProgram: {
      const stepper = new TreeStepper(action.payload);

      let nextStatement = stepper.next(new ExpressionUnit());
      if (nextStatement) {
        Object.assign(newState, {
          mode: Mode.SelectingStatement,
          feedback: <><span className="panel-name">PROGRAM</span> is loaded.</>,
          objective: <>What code is evaluated first?</>,
          program: action.payload,
          steppers: state.steppers.push(stepper),
          nextStatement: nextStatement,
        });
      } else {
        Object.assign(newState, {
          objective: <>This program doesn't have anything in it! There's nothing to do.</>,
          mode: Mode.Celebrating,
        });
      }

      break;
    }

    case Action.EditInput: {
      Object.assign(newState, {
        currentInput: action.payload,
      });
      break;
    }

    case Action.SelectRightSubexpression: {
      Object.assign(newState, {
        isBadSelection: false,
        activeSubexpression: action.payload,
        hoveredElement: null,
        feedback: null,
      });

      const isAssignment = action.payload instanceof ExpressionAssignment;
      if (isAssignment) {
        const hasVariable = state.memory.stack[state.memory.stack.length - 1].variables.some(variable => variable.name === action.payload.identifier.source);

        Object.assign(newState, {
          expectedName: action.payload.identifier.source,
          expectedValue: action.payload.rvalue,
          objective: <>What happens in memory to execute this assignment?</>,
        });

        if (hasVariable) {
          newState.mode = Mode.SelectingMemoryValue;
        } else {
          newState.mode = Mode.DeclaringVariable;
        }
      } else if (action.payload instanceof ExpressionUserFunctionCall) {
        Object.assign(newState, {
          feedback: <>The code <code className="code prompt-code">{action.payload.promptify(false)}</code> is a function call.</>,
          objective: <>What happens next in memory?</>,
          pausedExpressions: state.pausedExpressions.push(state.expression),
          pausedActiveSubexpressions: state.pausedActiveSubexpressions.push(action.payload),
          mode: Mode.PushingFrame,
          functionName: action.payload.name,
          functionDefinition: state.memory.stack[state.memory.stack.length - 1].functions[action.payload.name],
        });
      } else if (action.payload instanceof ExpressionReturn) {
        Object.assign(newState, {
          feedback: null,
          objective: <>What happens in <span className="panel-name">STACK</span> to execute this return statement?</>,
          mode: Mode.SelectingMemoryValue,
          expectedName: 'return',
          expectedValue: action.payload.expression,
        });
      } else {
        if (action.payload instanceof ExpressionPrint || action.payload instanceof ExpressionPrintLine) {
          newState.output = <>{state.output}<span className="output-text">{action.payload.output}</span></>;
          newState.feedback = <>The <code className="code prompt-code">{action.payload.name}</code> command has sent its output to <span className="panel-name">CONSOLE</span>.</>;
        }

        if (action.payload instanceof ExpressionReadLine) {
          newState.objective = <>The <code className="code prompt-code">readLine</code> command gets text from the user. What text shall the user enter?</>;
          newState.mode = Mode.EnteringUserInput;
        } else {
          newState.objective = <>What is the value of <code className="code prompt-code">{action.payload.promptify(false)}</code>?</>;
          newState.mode = Mode.EvaluatingSubexpression;
        }

        try {
          newState.expectedValue = newState.activeSubexpression.evaluate(newState.memory);
        } catch (e) {
          newState.isCrashing = true;
        }
      }

      break;
    }

    case Action.EnterUserInput: {
      const simplifiedExpression = state.expression.simplify(state.activeSubexpression, action.payload);

      Object.assign(newState, {
        activeSubexpression: null,
        currentInput: '',
        expression: simplifiedExpression,
        output: <>{state.output}<span className="input-text">{action.payload.value + '\n'}</span></>,
      });

      if (simplifiedExpression.isSimplified()) {
        Object.assign(newState, {
          nextStatement: state.steppers.top.next(simplifiedExpression),
          isStatementEvaluated: true,
        });
     
        if (newState.nextStatement) {
          Object.assign(newState, {
            mode: Mode.SelectingStatement,
            feedback: <>You've whittled <code className="code prompt-code">{state.statements.top.promptify(false)}</code> down to <code className="code prompt-code">{simplifiedExpression.promptify(false)}</code>, a primitive.</>,
            objective: <>What code in <span className="panel-name">PROGRAM</span> is evaluated next?</>,
          });
        } else {
          Object.assign(newState, {
            mode: Mode.Celebrating,
            feedback: null,
            objective: "You are all done!",
          });
        }
      } else {
        Object.assign(newState, {
          mode: Mode.SelectingSubexpression,
          feedback: <>Okay, the user entered the string <code className="code prompt-code">"{state.currentInput}"</code>.</>,
          objective: "What subexpression is evaluated next?",
        });
      }

      break;
    }

    case Action.SelectWrongSubexpression: {
      Object.assign(newState, {
        clickedElement: action.payload,
        hoveredElement: null,
        isBadSelection: true,
      });

      if (newState.mode !== Mode.Celebrating) {
        if (newState.mode !== Mode.SelectingSubexpression) {
          newState.feedback = <>No, all work in <span className="panel-name">EVALUATOR</span> is paused until we finish executing <code className="code prompt-code">{action.payload.promptify(false)}</code>.</>;
        } else if (action.payload instanceof ExpressionLValue) {
          newState.feedback = <>No, <code className="code prompt-code">{action.payload.promptify(false)}</code> is assigned a value but does not itself get evaluated.</>;
        } else if (action.payload.isSimplified()) {
          newState.feedback = <>No, <code className="code prompt-code">{action.payload.promptify(false)}</code> is a primitive and can't be evaluated further.</>;
        } else if (newState.mode === Mode.SelectingSubexpression) {
          newState.feedback = <>No, we'll evaluate <code className="code prompt-code">{action.payload.promptify(false)}</code> soon, but not yet.</>;
        }
      }

      break;
    }

    case Action.StopShaking: {
      Object.assign(newState, {
        clickedElement: null,
        isBadSelection: false,
        isBadInput: false,
        isBadDeclareVariable: false,
        isBadPushFrame: false,
        isBadPopFrame: false,
        isBadCrash: false,
      });
      break;
    }

    case Action.EnterRightSubexpressionValue: {
      const simplifiedExpression = state.expression.simplify(state.activeSubexpression, action.payload);

      Object.assign(newState, {
        isBadInput: false,
        activeSubexpression: null,
        currentInput: '',
        expression: simplifiedExpression,
      });

      if (simplifiedExpression.isSimplified()) {
        Object.assign(newState, {
          nextStatement: state.steppers.top.next(simplifiedExpression),
          isStatementEvaluated: true,
        });
      }
     
      if (state.isPopNeeded) {
        Object.assign(newState, {
          feedback: "The function call is nearly complete.",
          objective: <>What happens in <span className="panel-name">STACK</span> to finish it off?</>,
          mode: Mode.PoppingFrame,
          isPopNeeded: false,
        });
      } else if (simplifiedExpression.isSimplified() && !newState.nextStatement) {
        newState.mode = Mode.Celebrating;
        newState.feedback = null;
        newState.objective = "You are all done!";
      } else if (simplifiedExpression.isSimplified()) {
        newState.mode = Mode.SelectingStatement;
        newState.feedback = <>You've whittled <code className="code prompt-code">{state.statements.top.promptify(false)}</code> down to <code className="code prompt-code">{simplifiedExpression.promptify(false)}</code>, a primitive.</>;
        newState.objective = <>What code in <span className="panel-name">PROGRAM</span> is evaluated next?</>;
      } else {
        newState.mode = Mode.SelectingSubexpression;
        newState.feedback = "That's right.";
        newState.objective = "What subexpression is evaluated next?";
      }

      break;
    }

    case Action.EnterWrongSubexpressionValue: {
      Object.assign(newState, {
        feedback: action.payload,
        isBadInput: true,
      });
      break;
    }

    case Action.SelectRightMemoryValue: {
      const term = state.parameterIndex === null ? 'variable' : 'parameter';

      Object.assign(newState, {
        feedback: <>Yes, we must update {term} <code className="code prompt-code">{state.expectedName}</code>.</>,
        isBadSelection: false,
        mode: Mode.EnteringMemoryValue,
      });

      if (state.parameterIndex === null) {
        newState.objective = <>What's the new value of variable <code className="code prompt-code">{state.expectedName}</code>?</>;
      } else {
        newState.objective = <>What's the actual value for parameter <code className="code prompt-code">{state.expectedName}</code>?</>;
      }

      break;
    }

    case Action.SelectWrongMemoryValue: {
      Object.assign(newState, {
        feedback: <>No, we're not updating variable <code className="code prompt-code">{action.payload.name}</code> right now.</>,
        clickedElement: action.payload,
        hoveredElement: null,
        isBadSelection: true,
      });

      break;
    }

    case Action.SelectRightStatement: {
      // The user clicked on the correct next statement.

      let expression = action.payload;

      Object.assign(newState, {
        isBadSelection: false,
        statements: (state.isStatementEvaluated ? state.statements.bottoms : state.statements).push(state.nextStatement),
        nextStatement: null,
        isStatementEvaluated: false,
      });

      // if (state.isStatementEvaluated) {
        // Object.assign(newState, {
          // statements: state.statements.pop(),
          // isStatementEvaluated: false,
        // });
      // }

      // If the statement is already simplified, we advance to the next one and
      // bypass the Evaluator completely.
      if (expression.isSimplified()) {
        Object.assign(newState, {
          isStatementEvaluated: true,
        });

        // If the statement is a function definition, we must make record of
        // the function in the current stack frame.
        if (expression instanceof ExpressionFunctionDefinition) {
          const topFrame = state.memory.stack[state.memory.stack.length - 1];

          Object.assign(newState, {
            feedback: <>The function <code className="code prompt-code">{expression.identifier}</code> is now defined.</>,
            memory: {
              ...state.memory,
              stack: [
                ...state.memory.stack.slice(0, state.memory.stack.length - 1),
                {
                  ...topFrame,
                  functions: {
                    ...topFrame.functions,
                    [expression.identifier]: expression,
                  }
                }
              ],
            },
          });
        }

        // Otherwise we have some weird statement like "7".
        else {
          newState.feedback = <>The statement <code className="code prompt-code">{expression.promptify(false)}</code> is already fully evaluated.</>;
        }

        // What comes after this already simplified statement? If there is
        // something, we prompt for the next statement.
        newState.nextStatement = state.steppers.top.next(new ExpressionUnit());
        if (newState.nextStatement) {
          Object.assign(newState, {
            objective: <>What code is evaluated next?</>,
            mode: Mode.SelectingStatement,
          });
        }

        // If there is no next statement, the program has finished executing.
        else {
          Object.assign(newState, {
            feedback: 'You did did did it!',
            objective: null,
            mode: Mode.Celebrating,
          });
        }
      }

      // If the statement is not simplified, we load it into the Evaluator for
      // simplification.
      else {
        Object.assign(newState, {
          expression: expression.clone(),
          feedback: <>That's right. Let's whittle <code className="code prompt-code">{state.nextStatement.promptify(false)}</code> down in <span className="panel-name">EVALUATOR</span>.</>,
          objective: <>What subexpression is evaluated first?</>,
          mode: Mode.SelectingSubexpression,
        });
      }

      break;
    }

    case Action.SelectWrongStatement: {
      Object.assign(newState, {
        clickedElement: action.payload,
        hoveredElement: null,
        isBadSelection: true,
        feedback: `No, that code is not executed next.`,
      });

      break;
    }

    case Action.EnterRightMemoryValue: {
      const topFrame = state.memory.stack[state.memory.stack.length - 1];

      Object.assign(newState, {
        isBadInput: false,
        currentInput: '',
        memory: {
          ...state.memory,
          stack: [...state.memory.stack.slice(0, state.memory.stack.length - 1), {
            ...topFrame,
            variables: topFrame.variables.map(variable => {
              if (variable.name === state.expectedName) {
                return {
                  name: variable.name,
                  current: state.expectedValue,
                  history: variable.current instanceof ExpressionUndefined ? variable.history : [variable.current].concat(variable.history),
                };
              } else {
                return variable;
              }
            }),
          }],
        },
      });

      if (state.expression instanceof ExpressionAssignment) {
        Object.assign(newState, {
          mode: Mode.EvaluatingSubexpression,
          objective: <>What value is substituted for <code className="code prompt-code">{state.activeSubexpression.promptify(false)}</code>?</>,
          feedback: <>The assignment has updated memory.</>,
        });
      } else if (state.parameterIndex === null) {
        const simplifiedExpression = state.expression.simplify(state.activeSubexpression, state.expectedValue);
        newState.expression = simplifiedExpression;

        if (simplifiedExpression.isSimplified()) {
          Object.assign(newState, {
            nextStatement: state.steppers.top.next(simplifiedExpression),
            isStatementEvaluated: true,
          });
        }

        if (state.expression instanceof ExpressionReturn) {
          const activeSubexpression = state.pausedActiveSubexpressions.top;

          Object.assign(newState, {
            statements: state.statements.bottoms,
            steppers: state.steppers.bottoms,
            mode: Mode.EvaluatingSubexpression,
            expression: state.pausedExpressions.top,
            pausedExpressions: state.pausedExpressions.bottom,
            activeSubexpression,
            pausedActiveSubexpressions: state.pausedActiveSubexpressions.bottom,
            objective: <>What value is substituted for <code className="code prompt-code">{activeSubexpression.promptify(false)}</code>?</>,
            feedback: <>The function has finished executing and has returned to the call.</>,
            isPopNeeded: true,
          });
        } else if (simplifiedExpression.isSimplified() && newState.nextStatement === null) {
          Object.assign(newState, {
            mode: Mode.Celebrating,
            feedback: null,
            objective: "You are all done!",
          });
        } else if (simplifiedExpression.isSimplified()) {
          Object.assign(newState, {
            mode: Mode.SelectingStatement,
            feedback: <>You've whittled <code className="code prompt-code">{state.statements.top.promptify(false)}</code> down to <code className="code prompt-code">{simplifiedExpression.promptify(false)}</code>, a primitive.</>,
            objective: <>What code in <span className="panel-name">PROGRAM</span> is evaluated next?</>,
          });
        } else {
          Object.assign(newState, {
            mode: Mode.SelectingSubexpression,
            feedback: null,
            objective: "next expression?",
          });
        }
      } else {
        if (state.parameterIndex + 1 < state.functionDefinition.formals.length) {
          Object.assign(newState, {
            mode: Mode.DeclaringVariable,
            parameterIndex: state.parameterIndex + 1,
            feedback: null,
            objective: "What happens next to execute this function call?",
          });
        } else {
          const stepper = new TreeStepper(state.functionDefinition.body);
          newState.nextStatement = stepper.next(new ExpressionUnit());

          Object.assign(newState, {
            mode: Mode.SelectingStatement,
            feedback: null,
            objective: "What happens next to execute this function call?",
            parameterIndex: null,
            steppers: state.steppers.push(stepper),
          });
        }
      }

      break;
    }

    case Action.EnterRightVariableName: {
      const topFrame = state.memory.stack[state.memory.stack.length - 1];
      const term = state.parameterIndex === null ? 'variable' : 'parameter';
      Object.assign(newState, {
        isBadInput: false,
        currentInput: '',
        feedback: <>Yes, that's the {term}'s name.</>,
        mode: Mode.SelectingMemoryValue,
        memory: {
          ...state.memory,
          stack: [...state.memory.stack.slice(0, state.memory.stack.length - 1), {
            ...topFrame,
            variables: [{
              name: state.expectedName,
              current: topFrame.variables[0].current,
              history: topFrame.variables[0].history,
            }, ...topFrame.variables.slice(1)],
          }],
        },
      });

      if (state.parameterIndex === null) {
        newState.objective = <>What happens next to execute this assignment?</>;
      } else {
        newState.objective = <>What happens next to execute this call?</>;
      }

      break;
    }

    case Action.EnterWrongVariableName: {
      Object.assign(newState, {
        feedback: <>No, <code className="code prompt-code">{action.payload}</code> is not the right name.</>,
        isBadInput: true,
      });

      break;
    }


    case Action.EnterWrongMemoryValue: {
      Object.assign(newState, {
        feedback: action.payload,
        isBadInput: true,
      });

      break;
    }

    case Action.DeclareVariableRightly: {
      const newVariable = {
        name: '',
        current: new ExpressionUndefined(),
        history: [],
      };

      const topFrame = state.memory.stack[state.memory.stack.length - 1];
      const term = state.parameterIndex >= 0 ? 'parameter' : 'variable';

      Object.assign(newState, {
        isBadDeclareVariable: false,
        mode: Mode.NamingVariable,
        feedback: <>Yes, we declare a new {term}.</>,
        objective: <>What is the {term}'s name?</>,
        memory: {
          ...state.memory,
          stack: [...state.memory.stack.slice(0, state.memory.stack.length - 1), {
            ...topFrame,
            variables: [newVariable, ...topFrame.variables]
          }],
        },
      });

      if (state.parameterIndex !== null) {
        Object.assign(newState, {
          expectedName: state.functionDefinition.formals[state.parameterIndex],
          expectedValue: state.activeSubexpression.operands[state.parameterIndex],
        });
      } else {
        Object.assign(newState, {
          expectedName: state.activeSubexpression.identifier.source,
          expectedValue: state.activeSubexpression.rvalue,
        });
      }

      break;
    }

    case Action.DeclareVariableWrongly: {
      Object.assign(newState, {
        feedback: <>No, we don't need a new variable right now.</>,
        isBadDeclareVariable: true,
      });

      break;
    }

    case Action.PushFrameRightly: {
      Object.assign(newState, {
        feedback: <>Yes, a new stack frame for <code className="code prompt-code">{state.functionName}</code> is pushed.</>,
        isBadPushFrame: false,
      });

      if (state.functionDefinition.formals.length > 0) {
        Object.assign(newState, {
          objective: <>What happens next in <span className="panel-name">STACK</span>?</>,
          mode: Mode.DeclaringVariable,
          parameterIndex: 0,
        });
      } else {
        Object.assign(newState, {
          objective: <>What code is executed next?</>,
          mode: Mode.SelectingStatement,
        });
      }

      newState.memory = {
        ...state.memory,
        stack: [
          ...state.memory.stack,
          {
            name: state.functionName,
            variables: [
              {
                name: 'return',
                current: new ExpressionUndefined(),
                history: [],
              },
            ],
            functions: {},
          }
        ],
      };

      break;
    }

    case Action.PopFrameRightly: {
      Object.assign(newState, {
        feedback: <>Yes, we pop the stack frame.</>,
        isBadPopFrame: false,
      });

      newState.memory = {
        ...state.memory,
        stack: [...state.memory.stack.slice(0, state.memory.stack.length - 1)],
      };

      if (state.expression.isSimplified() && !newState.nextStatement) {
        newState.mode = Mode.Celebrating;
        newState.feedback = null;
        newState.objective = "You are all done!";
      } else if (state.expression.isSimplified()) {
        newState.mode = Mode.SelectingStatement;
        newState.feedback = <>You've whittled <code className="code prompt-code">{newState.statements.top.promptify(false)}</code> down to <code className="code prompt-code">{state.expressiostate.expression.promptify(false)}</code>, a primitive.</>;
        newState.objective = <>What code in <span className="panel-name">PROGRAM</span> is evaluated next?</>;
      } else {
        newState.mode = Mode.SelectingSubexpression;
        newState.feedback = <>Okay, the function's memory in <span className="panel-name">STACK</span> has been reclaimed.</>;
        newState.objective = "What subexpression is evaluated next?";
      }

      break;
    }

    case Action.PushFrameWrongly: {
      Object.assign(newState, {
        feedback: <>No, we don't need a new stack frame right now.</>,
        isBadPushFrame: true,
      });

      break;
    }

    case Action.PopFrameWrongly: {
      Object.assign(newState, {
        feedback: <>No, we're not ready to pop the stack frame yet.</>,
        isBadPopFrame: true,
      });

      break;
    }

    case Action.CrashRightly: {
      Object.assign(newState, {
        feedback: <>Yes, the program crashes.</>,
        objective: <>You are all done!</>,
        isBadCrash: false,
        mode: Mode.Celebrating,
      });

      break;
    }

    case Action.CrashWrongly: {
      Object.assign(newState, {
        feedback: <>No, the program hasn't crashed.</>,
        isBadCrash: true,
      });

      break;
    }

    default:
  }

  // console.log("POST REDUCE newState:", newState);

  return newState;
}
