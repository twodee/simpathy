export const Action = Object.freeze({
  Hover: 'Hover',
  Unhover: 'Unhover',
  ShowMessage: 'ShowMessage',
  LoadExpression: 'LoadExpression',
  SelectSubexpression: 'SelectSubexpression',
  StartShakingOperation: 'StartShakingOperation',
  StopShakingOperation: 'StopShakingOperation',
  StartShakingEvaluation: 'StartShakingEvaluation',
  StopShakingEvaluation: 'StopShakingEvaluation',
  EditValue: 'EditValue',
  EvaluateCorrectly: 'EvaluateCorrectly',
  EvaluateIncorrectly: 'EvaluateIncorrectly',
  SelectMemoryValue: 'SelectMemoryValue',
  SelectRightMemoryValue: 'SelectRightMemoryValue',
  SelectWrongMemoryValue: 'SelectWrongMemoryValue',
  StopShakingMemoryValue: 'StopShakingMemoryValue',
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

export function selectSubexpression(expression) {
  return {
    type: Action.SelectSubexpression,
    payload: expression,
  };
}

// --------------------------------------------------------------------------- 

export function startShakingOperation(expression) {
  return {
    type: Action.StartShakingOperation,
    payload: expression,
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

export function editValue(value) {
  return {
    type: Action.EditValue,
    payload: value,
  };
}

// --------------------------------------------------------------------------- 

export function evaluateCorrectly(value) {
  return {
    type: Action.EvaluateCorrectly,
    payload: value,
  };
}

// --------------------------------------------------------------------------- 

export function evaluateIncorrectly(value) {
  return {
    type: Action.EvaluateIncorrectly,
    payload: value,
  };
}

// --------------------------------------------------------------------------- 

export function selectMemoryValue(expected) {
  return {
    type: Action.SelectMemoryValue,
    payload: expected,
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

export function stopShakingMemoryValue(message) {
  return {
    type: Action.StopShakingMemoryValue,
  };
}

// --------------------------------------------------------------------------- 

