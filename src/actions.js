export const Action = Object.freeze({
  HoverSubexpression: 'HoverSubexpression',
  UnhoverSubexpression: 'UnhoverSubexpression',
  ShowMessage: 'ShowMessage',
  LoadExpression: 'LoadExpression',
  EvaluateSubexpression: 'EvaluateSubexpression',
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

export function evaluateSubexpression(expression) {
  return {
    type: Action.EvaluateSubexpression,
    payload: expression,
  };
}

// --------------------------------------------------------------------------- 

