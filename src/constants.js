export const Precedence = Object.freeze({
  Atom: 100,
  Power: 95,
  Not: 90,
  Multiplicative: 80,
  Additive: 70,
  Shift: 65,
  And: 60,
  Or: 59,
  Relational: 50,
  Equality: 45,
  Assignment: 15,
});

export const Mode = Object.freeze({
  SelectingStatement: 'SelectingStatement',
  SelectingSubexpression: 'SelectingSubexpression',
  SelectingMemoryValue: 'SelectingMemoryValue',
  PushingFrame: 'PushingFrame',
  PoppingFrame: 'PoppingFrame',
  PushingParameters: 'PushingParameters',
  EvaluatingSubexpression: 'EvaluatingSubexpression',
  EnteringMemoryValue: 'EnteringMemoryValue',
  Declaring: 'Declaring',
  Naming: 'Naming',
  EnteringUserInput: 'EnteringUserInput',
  Celebrating: 'Celebrating',
});
