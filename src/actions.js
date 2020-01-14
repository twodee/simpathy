export const Action = Object.freeze({
  HoverSubexpression: 'HoverSubexpression',
  UnhoverSubexpression: 'UnhoverSubexpression',
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
});

// --------------------------------------------------------------------------- 

// function throwErrors(response) {
  // if (!response.ok) {
    // throw Error(response.statusText);
  // }
  // return response;
// }

// --------------------------------------------------------------------------- 

export function hoverSubexpression(subexpression) {
  return {
    type: Action.HoverSubexpression,
    payload: subexpression,
  };
}

// --------------------------------------------------------------------------- 

export function unhoverSubexpression(subexpression) {
  return {
    type: Action.UnhoverSubexpression,
    payload: subexpression,
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

