export const Action = Object.freeze({
  FailCompile: 'FailCompile',
  Hover: 'Hover',
  Unhover: 'Unhover',
  LoadProgram: 'LoadProgram',
  EditInput: 'EditInput',
  StopShaking: 'StopShaking',
  DeclareRightly: 'DeclareVariableRightly',
  DeclareWrongly: 'DeclareVariableWrongly',
  PushFrameRightly: 'PushFrameRightly',
  PushFrameWrongly: 'PushFrameWrongly',
  PopFrameRightly: 'PopFrameRightly',
  PopFrameWrongly: 'PopFrameWrongly',
  CrashRightly: 'CrashRightly',
  CrashWrongly: 'CrashWrongly',

  SelectRightSubexpression: 'SelectRightSubexpression',
  SelectWrongSubexpression: 'SelectWrongSubexpression',
  SelectRightMemoryValue: 'SelectRightMemoryValue',
  SelectWrongMemoryValue: 'SelectWrongMemoryValue',
  SelectRightStatement: 'SelectRightStatement',
  SelectWrongStatement: 'SelectWrongStatement',
  SelectRightFunctionDefinition: 'SelectRightFunctionDefinition',

  EnterUserInput: 'EnterUserInput',
  EnterRightSubexpressionValue: 'EnterRightSubexpressionValue',
  EnterWrongSubexpressionValue: 'EnterWrongSubexpressionValue',
  EnterRightMemoryValue: 'EnterRightMemoryValue',
  EnterWrongMemoryValue: 'EnterWrongMemoryValue',
  EnterRightVariableName: 'EnterRightVariableName',
  EnterWrongVariableName: 'EnterWrongVariableName',
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

export function enterUserInput(value) {
  return {
    type: Action.EnterUserInput,
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

export function enterWrongSubexpressionValue(feedback) {
  return {
    type: Action.EnterWrongSubexpressionValue,
    payload: feedback,
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

export function enterWrongMemoryValue(feedback) {
  return {
    type: Action.EnterWrongMemoryValue,
    payload: feedback,
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

export function enterWrongVariableName(name) {
  return {
    type: Action.EnterWrongVariableName,
    payload: name,
  };
}

export function failCompile(message) {
  return {
    type: Action.FailCompile,
    payload: message,
  };
}

export function declareWrongly(frameIndex) {
  return {
    type: Action.DeclareWrongly,
    payload: frameIndex,
  };
}

export function popFrameWrongly(frameIndex) {
  return {
    type: Action.PopFrameWrongly,
    payload: frameIndex,
  };
}

export const declareRightly = () => ({type: Action.DeclareRightly});
export const enterRightVariableName = () => ({type: Action.EnterRightVariableName});
export const pushFrameRightly = () => ({type: Action.PushFrameRightly});
export const pushFrameWrongly = () => ({type: Action.PushFrameWrongly});
export const popFrameRightly = () => ({type: Action.PopFrameRightly});
export const crashRightly = () => ({type: Action.CrashRightly});
export const crashWrongly = () => ({type: Action.CrashWrongly});

// --------------------------------------------------------------------------- 

