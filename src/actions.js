export const Action = Object.freeze({
  Hover: 'Hover',
  Unhover: 'Unhover',
  LoadProgram: 'LoadProgram',
  EditInput: 'EditInput',
  StopShaking: 'StopShaking',

  SelectRightSubexpression: 'SelectRightSubexpression',
  SelectWrongSubexpression: 'SelectWrongSubexpression',
  SelectRightMemoryValue: 'SelectRightMemoryValue',
  SelectWrongMemoryValue: 'SelectWrongMemoryValue',
  SelectRightStatement: 'SelectRightStatement',
  SelectWrongStatement: 'SelectWrongStatement',

  EnterRightSubexpressionValue: 'EnterRightSubexpressionValue',
  EnterWrongSubexpressionValue: 'EnterWrongSubexpressionValue',
  EnterRightMemoryValue: 'EnterRightMemoryValue',
  EnterWrongMemoryValue: 'EnterWrongMemoryValue',
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

export function loadExpression(expression) {
  return {
    type: Action.LoadExpression,
    payload: expression,
  };
}

// --------------------------------------------------------------------------- 

export function loadProgram(program) {
  return {
    type: Action.LoadProgram,
    payload: program,
  };
}

// --------------------------------------------------------------------------- 

export function selectRightSubexpression(expression) {
  return {
    type: Action.SelectRightSubexpression,
    payload: expression,
  };
}

// --------------------------------------------------------------------------- 

export function selectWrongSubexpression(expression) {
  return {
    type: Action.SelectWrongSubexpression,
    payload: expression,
  };
}

// --------------------------------------------------------------------------- 

export function stopShaking() {
  return {
    type: Action.StopShaking,
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

export function selectRightStatement(piece) {
  return {
    type: Action.SelectRightStatement,
    payload: piece,
  };
}

// --------------------------------------------------------------------------- 

export function selectWrongStatement(piece) {
  return {
    type: Action.SelectWrongStatement,
    payload: piece,
  };
}

// --------------------------------------------------------------------------- 

