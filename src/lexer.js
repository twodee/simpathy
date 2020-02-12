import {
  Token,
  SourceLocation
} from './token.js';

import {
  LocatedException,
} from './types.js';

export function lex(source) {
  let iStartIndex = 0;
  let iEndIndex = -1;
  let iStartColumn = 0;
  let iEndColumn = -1;
  let iStartLine = 0;
  let iEndLine = 0;

  let i = 0;
  let tokens = [];
  let tokenSoFar = '';

  function consume() {
    iEndIndex += 1;
    iEndColumn += 1;
    if (source[i] === '\n') {
      iEndLine += 1;
      iEndColumn = -1;
    }
    tokenSoFar += source[i];
    i += 1;
  }

  function has(pattern, offset) {
    let index = i;
    if (offset) {
      index = i + offset;
    }

    if (index < 0 || index >= source.length) {
      return false;
    } else if (pattern instanceof RegExp) {
      return source.charAt(index).match(pattern);
    } else {
      return source.charAt(index) === pattern;
    }
  }

  function resetToken() {
    iStartIndex = iEndIndex + 1;
    iStartColumn = iEndColumn + 1;
    iStartLine = iEndLine;
    tokenSoFar = '';
  }

  function emit(type) {
    tokens.push(new Token(type, tokenSoFar, new SourceLocation(iStartLine, iEndLine, iStartColumn, iEndColumn, iStartIndex, iEndIndex)));
    resetToken();
  }

  function dash() {
    consume();

    if (has(/\d/)) {
      digits();
    } else if (has('>')) {
      consume();
      emit(Token.RightArrow);
    } else if (has('.')) {
      decimal();
    } else {
      emit(Token.Minus);
    }
  }

  function character() {
    consume();
    consume();
    if (!has("'")) {
      throw new LocatedException(new SourceLocation(iStartLine, iEndLine, iStartColumn, iEndColumn, iStartIndex, iEndIndex), `I see a character literal, but it isn't closed with '.`);
    }
    consume();
    tokenSoFar = tokenSoFar.substr(1, tokenSoFar.length - 2); // chop off '
    emit(Token.Character);
  }

  function string() {
    consume();
    // TODO newline?
    while (!has('"')) {
      consume();
    }
    consume();
    tokenSoFar = tokenSoFar.substr(1, tokenSoFar.length - 2); // chop off "
    emit(Token.String);
  }

  function symbol() {
    consume(); // eat symbol lead
    while (has(/[-a-zA-Z0-9_]/)) {
      consume();
    }
    emit(Token.Symbol);
  }

  function identifier() {
    consume(); // eat identifier lead
    while (has(/[a-zA-Z0-9_]/)) {
      consume();
    }

    if (tokenSoFar === 't') {
      emit(Token.T);
    } else if (tokenSoFar === 'repeat') {
      emit(Token.Repeat);
    } else if (tokenSoFar === 'while') {
      emit(Token.While);
    } else if (tokenSoFar === 'true') {
      emit(Token.Boolean);
    } else if (tokenSoFar === 'false') {
      emit(Token.Boolean);
    } else if (tokenSoFar === 'for') {
      emit(Token.For);
    } else if (tokenSoFar === 'in') {
      emit(Token.In);
    } else if (tokenSoFar === 'if') {
      if (tokens.length > 0 && tokens[tokens.length - 1].type === Token.Else) {
        let elseToken = tokens.pop();
        iStartLine = elseToken.where.lineStart;
        iStartColumn = elseToken.where.columnStart;
        tokenSoFar = 'else if';
        emit(Token.ElseIf);
      } else {
        emit(Token.If);
      }
    } else if (tokenSoFar === 'else') {
      emit(Token.Else);
    } else if (tokenSoFar === 'to') {
      emit(Token.To);
    } else if (tokenSoFar === 'in') {
      emit(Token.In);
    } else if (tokenSoFar === 'then') {
      emit(Token.Then);
    } else if (tokenSoFar === 'through') {
      emit(Token.Through);
    } else if (tokenSoFar === 'by') {
      emit(Token.By);
    } else {
      emit(Token.Identifier);
    }
  }

  function digits() {
    while (has(/\d/)) {
      consume();
    }

    if (has('.') && !has('.', 1)) {
      decimal();
    } else {
      if (has('e') && has(/\d/, 1)) {
        eSuffix();
      }
      emit(Token.Integer);
    }
  }

  function eSuffix() {
    consume();
    while (has(/\d/)) {
      consume();
    }
  }

  function decimal() {
    consume(); // eat .
    while (has(/\d/)) {
      consume();
    }

    // Handle e123.
    if (has('e') && has(/\d/, 1)) {
      eSuffix();
    }

    emit(Token.Real);
  }

  function dot() {
    if (has(/\d/, 1)) {
      decimal();
    } else {
      consume();
      if (has(/\./)) {
        consume();
        emit(Token.Range);
      } else {
        emit(Token.Dot);
      }
    }
  }

  function indentation() {
    while (has(/[ \t]/)) {
      consume();
    }

    if (has('/') && has('/', 1)) {
      consume();
      consume();
      wholeLineComment();
    } else {
      emit(Token.Indentation);
    }
  }

  function equals() {
    consume();
    if (has('=')) {
      consume();
      emit(Token.Same);
    } else {
      emit(Token.Assign);
    }
  }

  function bang() {
    consume();
    if (has('=')) {
      consume();
      emit(Token.Same);
    } else {
      emit(Token.Not);
    }
  }

  function ampersand() {
    consume();
    if (has('&')) {
      consume();
      emit(Token.And);
    }
  }

  function pipe() {
    consume();
    if (has('|')) {
      consume();
      emit(Token.Or);
    }
  }

  function less() {
    consume();
    if (has('=')) {
      consume();
      emit(Token.LessEqual);
    } else if (has('<')) {
      consume();
      emit(Token.LeftLeft);
    } else {
      emit(Token.Less);
    }
  }

  function more() {
    consume();
    if (has('=')) {
      consume();
      emit(Token.MoreEqual);
    } else if (has('>')) {
      consume();
      emit(Token.RightRight);
    } else {
      emit(Token.More);
    }
  }

  function inlineComment() {
    // eat till end of line
    while (i < source.length && !has('\n')) {
      consume();
    }
    resetToken();
  }

  function wholeLineComment() {
    // eat through end of line
    while (i < source.length && !has('\n')) {
      consume();
    }
    consume();
    resetToken();
    indentation();
  }

  indentation();
  while (i < source.length) {
    if (has(/\d/)) {
      digits();
    } else if (has(/[a-zA-Z_]/)) {
      identifier();
    } else if (has(':')) {
      symbol();
    } else if (has('"')) {
      string();
    } else if (has('\'')) {
      character();
    } else if (has('.')) {
      dot();
    } else if (has('&')) {
      ampersand();
    } else if (has('|')) {
      pipe();
    } else if (has('-')) {
      dash();
    } else if (has('=')) {
      equals();
    } else if (has('<')) {
      less();
    } else if (has('>')) {
      more();
    } else if (has('!')) {
      bang();
    } else if (has(',')) {
      consume();
      emit(Token.Comma);
    } else if (has('(')) {
      consume();
      emit(Token.LeftParenthesis);
    } else if (has(')')) {
      consume();
      emit(Token.RightParenthesis);
    } else if (has('{')) {
      consume();
      emit(Token.LeftCurlyBrace);
    } else if (has('}')) {
      consume();
      emit(Token.RightCurlyBrace);
    } else if (has('[')) {
      consume();
      emit(Token.LeftSquareBracket);
    } else if (has(']')) {
      consume();
      emit(Token.RightSquareBracket);
    } else if (has('+')) {
      consume();
      emit(Token.Plus);
    } else if (has('^')) {
      consume();
      emit(Token.Circumflex);
    } else if (has('*')) {
      consume();
      if (has('*')) {
        consume();
        emit(Token.Power);
      } else {
        emit(Token.Asterisk);
      }
    } else if (has('%')) {
      consume();
      emit(Token.Percent);
    } else if (has('/')) {
      consume();
      if (has('/')) {
        consume();
        inlineComment();
      } else {
        emit(Token.ForwardSlash);
      }
    } else if (has('\n')) {
      consume();
      emit(Token.Linebreak);
      indentation();
    } else if (has(' ')) {
      while (has(' ')) {
        consume();
      }
      resetToken();
    } else {
      consume();
      throw new LocatedException(new SourceLocation(iStartLine, iEndLine, iStartColumn, iEndColumn, iStartIndex, iEndIndex), `I encountered "${tokenSoFar}", and I don't know what it means.`);
    }
  }

  emit(Token.EOF);

  return tokens;
}
