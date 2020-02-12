let TokenTypes = Object.freeze({
  Assign: 'Assign',
  And: 'And',
  Asterisk: 'Asterisk',
  Boolean: 'Boolean',
  By: 'By',
  Character: 'Character',
  Circle: 'Circle',
  Circumflex: 'Circumflex',
  Comma: 'Comma',
  Dot: 'Dot',
  EOF: 'EOF',
  Else: 'Else',
  ElseIf: 'ElseIf',
  ForwardSlash: 'ForwardSlash',
  Identifier: 'Identifier',
  If: 'If',
  In: 'In',
  Indentation: 'Indentation',
  Integer: 'Integer',
  LeftCurlyBrace: 'LeftCurlyBrace',
  LeftLeft: 'LeftLeft',
  LeftParenthesis: 'LeftParenthesis',
  LeftSquareBracket: 'LeftSquareBracket',
  Less: 'Less',
  LessEqual: 'LessEqual',
  Linebreak: 'Linebreak',
  Minus: 'Minus',
  More: 'More',
  MoreEqual: 'MoreEqual',
  NotSame: 'NotSame',
  Not: 'Not',
  Or: 'Or',
  Percent: 'Percent',
  Plus: 'Plus',
  Power: 'Power',
  Range: 'Range',
  Real: 'Real',
  Repeat: 'Repeat',
  RightArrow: 'RightArrow',
  RightCurlyBrace: 'RightCurlyBrace',
  RightParenthesis: 'RightParenthesis',
  RightRight: 'RightRight',
  RightSquareBracket: 'RightSquareBracket',
  Same: 'Same',
  String: 'String',
  Symbol: 'Symbol',
  T: 'T',
  Then: 'Then',
  Through: 'Through',
  To: 'To',
  While: 'While',
});

export class SourceLocation {
  constructor(lineStart, lineEnd, columnStart, columnEnd) {
    this.lineStart = lineStart;
    this.lineEnd = lineEnd;
    this.columnStart = columnStart;
    this.columnEnd = columnEnd;
  }

  clone() {
    return new SourceLocation(this.lineStart, this.lineEnd, this.columnStart, this.columnEnd);
  }

  debugPrefix() {
    return this.lineStart + ':' +
           this.lineEnd + ':' +
           this.columnStart + ':' +
           this.columnEnd + ':';
  }

  static span(a, b) {
    return new SourceLocation(a.lineStart, b.lineEnd, a.columnStart, b.columnEnd);
  }
}

export class Token {
  constructor(type, source, where) {
    this.type = type;
    this.source = source;
    this.where = where;
  }
}

Object.assign(Token, TokenTypes);
