export const Action = Object.freeze({
  Hover: 'Hover',
  Unhover: 'Unhover',
  ShowMessage: 'ShowMessage',
  LoadExpression: 'LoadExpression',
  EditInput: 'EditInput',

  SelectAssignment: 'SelectAssignment',
  SelectRightSubexpression: 'SelectRightSubexpression',
  SelectWrongSubexpression: 'SelectWrongSubexpression',
  SelectRightMemoryValue: 'SelectRightMemoryValue',
  SelectWrongMemoryValue: 'SelectWrongMemoryValue',

  EnterRightSubexpressionValue: 'EnterRightSubexpressionValue',
  EnterWrongSubexpressionValue: 'EnterWrongSubexpressionValue',
  EnterRightMemoryValue: 'EnterRightMemoryValue',
  EnterWrongMemoryValue: 'EnterWrongMemoryValue',

  StopShakingOperation: 'StopShakingOperation',
  StopShakingEvaluation: 'StopShakingEvaluation',
  StopShakingMemoryValueSelection: 'StopShakingMemoryValueSelection',
  StopShakingMemoryValueInput: 'StopShakingMemoryValueInput',
});

// --------------------------------------------------------------------------- 

// function throwErrors(response) {
  // if (!response.ok) {
    // throw Error(response.statusText);
  // }
  // return response;
// }

// --------------------------------------------------------------------------- 

export function hover(element) {
  return {
    type: Action.Hover,
    payload: element,
  };
}

// --------------------------------------------------------------------------- 

export function unhover(element) {
  return {
    type: Action.Unhover,
    payload: element,
  };
}

// --------------------------------------------------------------------------- 

export function showMessage(message) {
  return {
    type: Action.ShowMessage,
    payload: message,
  };
}

// --------------------------------------------------------------------------- 

export function loadExpression(expression) {
  return {
    type: Action.LoadExpression,
    payload: expression,
  };
}

// --------------------------------------------------------------------------- 

export function selectRightSubexpression(expression, message) {
  return {
    type: Action.SelectRightSubexpression,
    payload: {expression, message},
  };
}

// --------------------------------------------------------------------------- 

export function selectWrongSubexpression(expression, message) {
  return {
    type: Action.SelectWrongSubexpression,
    payload: {expression, message},
  };
}

// --------------------------------------------------------------------------- 

export function stopShakingOperation() {
  return {
    type: Action.StopShakingOperation,
  };
}

// --------------------------------------------------------------------------- 

export function stopShakingEvaluation() {
  return {
    type: Action.StopShakingEvaluation,
  };
}

// --------------------------------------------------------------------------- 

export function editInput(value) {
  return {
    type: Action.EditInput,
    payload: value,
  };
}

// --------------------------------------------------------------------------- 

export function enterRightSubexpressionValue(value) {
  return {
    type: Action.EnterRightSubexpressionValue,
    payload: value,
  };
}

// --------------------------------------------------------------------------- 

export function enterWrongSubexpressionValue(value) {
  return {
    type: Action.EnterWrongSubexpressionValue,
    payload: value,
  };
}

// --------------------------------------------------------------------------- 

export function selectAssignment(assignmentExpression) {
  return {
    type: Action.SelectAssignment,
    payload: assignmentExpression,
  };
}

// --------------------------------------------------------------------------- 

export function selectRightMemoryValue(variable) {
  return {
    type: Action.SelectRightMemoryValue,
    payload: variable,
  };
}

// --------------------------------------------------------------------------- 

export function selectWrongMemoryValue(message) {
  return {
    type: Action.SelectWrongMemoryValue,
    payload: message,
  };
}

// --------------------------------------------------------------------------- 

export function stopShakingMemoryValueSelection(message) {
  return {
    type: Action.StopShakingMemoryValueSelection,
  };
}

// --------------------------------------------------------------------------- 

export function stopShakingMemoryValueInput(message) {
  return {
    type: Action.StopShakingMemoryValueInput,
  };
}

// --------------------------------------------------------------------------- 

export function enterRightMemoryValue() {
  return {
    type: Action.EnterRightMemoryValue,
  };
}

// --------------------------------------------------------------------------- 

export function enterWrongMemoryValue() {
  return {
    type: Action.EnterWrongMemoryValue,
  };
}

// --------------------------------------------------------------------------- 

