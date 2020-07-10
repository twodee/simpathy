import {
  Token,
  SourceLocation
} from './token';

import {
  LocatedException,
  // MessagedException,
} from './types';

import {
  ExpressionAdd,
  ExpressionAnd,
  ExpressionArrayConstructor,
  ExpressionLength,
  ExpressionPush,
  ExpressionAssignment,
  ExpressionBlock,
  ExpressionBoolean,
  // ExpressionCharacter,
  ExpressionDivide,
  // ExpressionFor,
  ExpressionUserFunctionCall,
  ExpressionFunctionDefinition,
  ExpressionIdentifier,
  ExpressionIf,
  ExpressionInteger,
  ExpressionLeftShift,
  ExpressionLess,
  ExpressionLessEqual,
  ExpressionBlankLine,
  ExpressionMax,
  ExpressionMin,
  ExpressionMemberFunctionCall,
  // ExpressionMemberIdentifier,
  ExpressionMore,
  ExpressionMoreEqual,
  ExpressionMultiply,
  // ExpressionNegative,
  ExpressionNotSame,
  ExpressionNot,
  ExpressionOr,
  ExpressionPower,
  ExpressionFormat,
  ExpressionPrint,
  ExpressionPrintLine,
  ExpressionReadLine,
  ExpressionReal,
  ExpressionReference,
  ExpressionRemoveIndex,
  ExpressionRightShift,
  ExpressionModulus,
  ExpressionParseInt,
  ExpressionParseFloat,
  ExpressionReturn,
  ExpressionSame,
  ExpressionSign,
  ExpressionString,
  ExpressionSubscript,
  ExpressionSubtract,
  // ExpressionVector,
  ExpressionWhile,
  ExpressionWholeLineComment,
} from './ast';

// import {
  // ExpressionVector
// } from './types.js';

// export let Symbols = {
  // None: new ExpressionInteger(-1),
// };

export function parse(tokens) {
  let i = 0;
  let indents = [-1];

  function has(type, offset) {
    let index = i;
    if (offset) {
      index = i + offset;
    }

    if (index < 0 || index >= tokens.length) {
      return false;
    } else {
      return tokens[index].type === type;
    }
  }

  function consume() {
    i += 1;
    return tokens[i - 1];
  }

  function program() {
    if (has(Token.Indentation) && tokens[i].source.length !== 0) {
      throw new LocatedException(tokens[i].where, 'I expected no indentation at the top-level of the program.');
    }

    let statements;
    if (has(Token.EOF)) {
      let eofToken = consume();
      statements = new ExpressionBlock([], eofToken.where);
    } else {
      statements = block();
      if (!has(Token.EOF)) {
        throw new LocatedException(statements.where, 'I expected the program to end after this, but it didn\'t.');
      }
    }

    return statements;
  }

  function block() {
    if (!has(Token.Indentation)) {
      throw new LocatedException(tokens[i].where, 'I expected the code to be indented here, but it wasn\'t.');
    }

    let indentation = tokens[i];

    if (indentation.source.length <= indents[indents.length - 1]) {
      throw new LocatedException(indentation.where, 'I expected the indentation to increase upon entering a block.');
    }
    indents.push(indentation.source.length);

    let statements = [];
    while (has(Token.Indentation) && tokens[i].source.length === indentation.source.length) {
      consume(); // eat indentation
      if (!has(Token.EOF)) {
        let s = statement();
        statements.push(s);
      }
    }

    if (tokens[i].source.length > indentation.source.length) {
      throw new LocatedException(tokens[i].where, `I expected consistent indentation within this block (which is indented with ${indentation.source.length} character${indentation.source.length === 1 ? '' : 's'}), but this indentation jumps around.`);
    }

    indents.pop();

    let sourceStart = indentation.where;
    let sourceEnd = sourceStart;
    if (statements.length > 0) {
      sourceStart = statements[0].where;
      sourceEnd = statements[statements.length - 1].where;
    }

    return new ExpressionBlock(statements, SourceLocation.span(sourceStart, sourceEnd));
  }

  function statement() {
    // TODO: how are multiple blank lines handled here? I think we're okay
    // becausing of intervening indentation.

    let e;
    if (has(Token.Return)) {
      const returnToken = consume();
      e = expression();
      e = new ExpressionReturn(e, SourceLocation.span(returnToken, e)); 
    } else if (has(Token.Linebreak)) {
      e = new ExpressionBlankLine();
      // No need to consume here because the node is fictitious.
    } else if (has(Token.WholeLineComment)) {
      e = new ExpressionWholeLineComment(tokens[i].source, tokens[i].where);
      consume();
    } else {
      e = expression();
    }

    if (has(Token.Linebreak)) {
      consume();
      return e;
    } else if (has(Token.EOF) || has(Token.Indentation)) { // Check for indentation because some expressions end in blocks, which have eaten their linebreak already
      return e;
    } else if (!has(Token.EOF)) {
      throw new LocatedException(tokens[i].where, `I expected a line break or the end the program, but I found ${tokens[i].source}.`);
    }
  }

  function expression() {
    return expressionAssignment();
  }

  function expressionAssignment() {
    if (has(Token.Identifier) && has(Token.Assign, 1)) {
      let identifier = consume();
      consume(); // eat =
      let rhs = expressionAssignment();
      return new ExpressionAssignment(identifier, rhs, SourceLocation.span(identifier.where, rhs.where));
    } else {
      return expressionOr();
    }
  }

  function expressionOr() {
    let a = expressionAnd();
    while (has(Token.Or)) {
      consume(); // eat or
      let b = expressionAnd();
      a = new ExpressionOr(a, b, SourceLocation.span(a.where, b.where));
    }
    return a;
  }

  function expressionAnd() {
    let a = expressionEquality();
    while (has(Token.And)) {
      consume(); // eat and
      let b = expressionEquality();
      a = new ExpressionAnd(a, b, SourceLocation.span(a.where, b.where));
    }
    return a;
  }

  function expressionEquality() {
    let a = expressionRelational();
    while (has(Token.Same) || has(Token.NotSame)) {
      let operator = consume();
      let b = expressionRelational();
      if (operator.type === Token.Same) {
        a = new ExpressionSame(a, b, SourceLocation.span(a.where, b.where));
      } else {
        a = new ExpressionNotSame(a, b, SourceLocation.span(a.where, b.where));
      }
    }
    return a;
  }

  function expressionRelational() {
    let a = expressionShift();
    while (has(Token.Less) || has(Token.More) || has(Token.LessEqual) || has(Token.MoreEqual)) {
      let operator = consume();
      let b = expressionShift();
      if (operator.type === Token.Less) {
        a = new ExpressionLess(a, b, SourceLocation.span(a.where, b.where));
      } else if (operator.type === Token.LessEqual) {
        a = new ExpressionLessEqual(a, b, SourceLocation.span(a.where, b.where));
      } else if (operator.type === Token.More) {
        a = new ExpressionMore(a, b, SourceLocation.span(a.where, b.where));
      } else {
        a = new ExpressionMoreEqual(a, b, SourceLocation.span(a.where, b.where));
      }
    }
    return a;
  }

  function expressionShift() {
    let a = expressionAdditive();
    while (has(Token.LeftLeft) || has(Token.RightRight)) {
      let operator = consume();
      let b = expressionAdditive();
      if (operator.type === Token.LeftLeft) {
        a = new ExpressionLeftShift(a, b, SourceLocation.span(a.where, b.where));
      } else {
        a = new ExpressionRightShift(a, b, SourceLocation.span(a.where, b.where));
      }
    }
    return a;
  }

  function expressionAdditive() {
    let a = expressionMultiplicative();
    while (has(Token.Plus) || has(Token.Minus)) {
      let operator = consume();
      let b = expressionMultiplicative();
      if (operator.type === Token.Plus) {
        a = new ExpressionAdd(a, b, SourceLocation.span(a.where, b.where));
      } else {
        a = new ExpressionSubtract(a, b, SourceLocation.span(a.where, b.where));
      }
    }
    return a;
  }

  function expressionMultiplicative() {
    let a = expressionUnary();
    while (has(Token.Asterisk) || has(Token.ForwardSlash) || has(Token.Percent)) {
      let operator = consume();
      let b = expressionUnary();
      if (operator.type === Token.Asterisk) {
        a = new ExpressionMultiply(a, b, SourceLocation.span(a.where, b.where));
      } else if (operator.type === Token.ForwardSlash) {
        a = new ExpressionDivide(a, b, SourceLocation.span(a.where, b.where));
      } else {
        a = new ExpressionModulus(a, b, SourceLocation.span(a.where, b.where));
      }
    }
    return a;
  }

  function expressionUnary() {
    let a;
    if (has(Token.Minus)) {
      consume(); // eat operator
      a = expressionUnary();
      // a = new ExpressionNegative(a, a.where);
    } else if (has(Token.Not)) {
      consume(); // eat operator
      a = expressionUnary();
      a = new ExpressionNot(a, a.where);
    } else {
      a = expressionPower();
    }
    return a;
  }

  function expressionPower() {
    let a = expressionMember();
    while (has(Token.Power)) {
      consume(); // eat **
      let b = expressionPower();
      a = new ExpressionPower(a, b, SourceLocation.span(a.where, b.where));
    }
    return a;
  }

  function expressionMember() {
    let base = atom();
    while (has(Token.Dot) || has(Token.LeftSquareBracket)) {
      if (has(Token.Dot)) {
        let dotToken = consume(); // eat .

        if (!has(Token.Identifier)) {
          throw new LocatedException(dotToken.where, `expected ID`);
        }

        let nameToken = consume();

        if (has(Token.LeftParenthesis)) {
          consume(); // eat (

          let actuals = [];
          if (isFirstOfExpression()) {
            actuals.push(expression());
            while (has(Token.Comma) && isFirstOfExpression(1)) {
              consume(); // eat ,
              actuals.push(expression());
            }
          }

          let sourceEnd = tokens[i].where;
          if (!has(Token.RightParenthesis)) {
            throw new LocatedException(SourceLocation.span(base.where, sourceEnd), `I expected a right parenthesis to close the function call, but I encountered "${tokens[i].source}" (${tokens[i].type}) instead.`);
          }
          consume();

          // TODO: assert arity
          if (nameToken.source === 'length') {
            base = new ExpressionLength(base, actuals, SourceLocation.span(base.where, sourceEnd));
          } else if (nameToken.source === 'push') {
            base = new ExpressionPush(base, actuals, SourceLocation.span(base.where, sourceEnd));
          } else if (nameToken.source === 'removeIndex') {
            base = new ExpressionRemoveIndex(base, actuals, SourceLocation.span(base.where, sourceEnd));
          } else {
            throw new LocatedException(SourceLocation.span(base.where, sourceEnd), 'I encountered an unknown function.');
            // base = new ExpressionMemberFunctionCall(nameToken, base, actuals, SourceLocation.span(base.where, sourceEnd));
          }
        }
      } else {
        consume(); // eat [
        let index = expression();
        if (!has(Token.RightSquareBracket)) {
          throw new LocatedException(index.where, `I expected a ] after this subscript.`);
        }
        let rightBracketToken = consume(); // eat ]
        base = new ExpressionSubscript(base, index, SourceLocation.span(base.where, rightBracketToken.where));
      }
    }
    return base;
  }

        // } else {
          // base = new ExpressionMemberIdentifier(base, nameToken, SourceLocation.span(base.where, nameToken.where));
      // } else {
      // }

  function isFirstOfExpression(offset = 0) {
    return has(Token.Integer, offset) ||
           has(Token.Real, offset) ||
           has(Token.Minus, offset) ||
           has(Token.Boolean, offset) ||
           has(Token.String, offset) ||
           has(Token.Identifier, offset) ||
           has(Token.Reference, offset) ||
           has(Token.LeftSquareBracket, offset) ||
           has(Token.LeftParenthesis, offset) ||
           has(Token.Repeat, offset) ||
           has(Token.While, offset) ||
           has(Token.For, offset) ||
           has(Token.If, offset);
  }

  function atom() {
    if (has(Token.Integer)) {
      let token = consume();
      return new ExpressionInteger(Number(token.source), token.where);
    } else if (has(Token.LeftParenthesis)) {
      let leftToken = consume();
      let a = expression();
      if (has(Token.RightParenthesis)) {
        consume();
        return a;
      } else {
        throw new LocatedException(SourceLocation.span(leftToken.where, a.where), 'I expected a right parenthesis after this expression.');
      }
    } else if (has(Token.String)) {
      let token = consume();
      return new ExpressionString(token.source, token.where);
    // } else if (has(Token.Character)) {
      // let token = consume();
      // return new ExpressionCharacter(token.source, token.where);
    } else if (has(Token.Real)) {
      let token = consume();
      return new ExpressionReal(Number(token.source), token.where);
    } else if (has(Token.Reference)) {
      let token = consume();
      console.log("token:", token);
      return new ExpressionReference(token.source, token.where);
    } else if (has(Token.Boolean)) {
      let token = consume();
      return new ExpressionBoolean(token.source === 'true', token.where);
    } else if (has(Token.Identifier) && has(Token.LeftParenthesis, 1)) {
      let sourceStart = tokens[i].where;

      let nameToken = consume();
      consume(); // eat (

      let actuals = [];
      if (isFirstOfExpression()) {
        actuals.push(expression());
        while (has(Token.Comma) && isFirstOfExpression(1)) {
          consume(); // eat ,
          actuals.push(expression());
        }
      }

      let sourceEnd = tokens[i].where;
      if (has(Token.RightParenthesis)) {
        consume();
      } else {
        throw new LocatedException(SourceLocation.span(sourceStart, sourceEnd), `I expected a right parenthesis to close the function call, but I encountered "${tokens[i].source}" (${tokens[i].type}) instead.`);
      }

      if (nameToken.source === 'max') {
        return new ExpressionMax(actuals, SourceLocation.span(nameToken, sourceEnd));
      } else if (nameToken.source === 'min') {
        return new ExpressionMin(actuals, SourceLocation.span(nameToken, sourceEnd));
      } else if (nameToken.source === 'format') {
        return new ExpressionFormat(actuals, SourceLocation.span(nameToken, sourceEnd));
      } else if (nameToken.source === 'print') {
        return new ExpressionPrint(actuals, SourceLocation.span(nameToken, sourceEnd));
      } else if (nameToken.source === 'printLine') {
        return new ExpressionPrintLine(actuals, SourceLocation.span(nameToken, sourceEnd));
      } else if (nameToken.source === 'readLine') {
        return new ExpressionReadLine(actuals, SourceLocation.span(nameToken, sourceEnd));
      } else if (nameToken.source === 'sign') {
        return new ExpressionSign(actuals, SourceLocation.span(nameToken, sourceEnd));
      } else if (nameToken.source === 'parseInt') {
        return new ExpressionParseInt(actuals, SourceLocation.span(nameToken, sourceEnd));
      } else if (nameToken.source === 'parseFloat') {
        return new ExpressionParseFloat(actuals, SourceLocation.span(nameToken, sourceEnd));
      } else if (nameToken.source === 'array') {
        return new ExpressionArrayConstructor(actuals, SourceLocation.span(nameToken, sourceEnd));
      } else {
        return new ExpressionUserFunctionCall(nameToken, actuals, SourceLocation.span(sourceStart, sourceEnd));
      }
    } else if (has(Token.Identifier)) {
      let where = tokens[i].where;
      let id = consume();
      return new ExpressionIdentifier(id, where);
    } else if (has(Token.Function)) {
      let sourceStart = tokens[i].where;
      consume(); // eat if

      if (!has(Token.Identifier)) {
        throw new LocatedException(tokens[i].where, 'I expected a function name after function.');
      }
      let idToken = tokens[i];
      consume();

      if (!has(Token.LeftParenthesis)) {
        throw new LocatedException(tokens[i].where, 'I expected a left parenthesis after a function\'s name.');
      }
      consume();

      // Parse formals.
      let formals = [];
      if (has(Token.Identifier)) {
        formals.push(tokens[i].source);
        consume();

        while (has(Token.Comma)) {
          consume(); // eat comma
          if (has(Token.Identifier)) {
            formals.push(tokens[i].source);
            consume();
          } else {
            throw new LocatedException(tokens[i].where, 'I expected a parameter name after a comma in the parameter list.');
          }
        }
      }

      if (!has(Token.RightParenthesis)) {
        throw new LocatedException(tokens[i].where, 'I expected a right parenthesis after a function\'s parameter list.');
      }
      consume();

      if (!has(Token.Linebreak)) {
        throw new LocatedException(tokens[i].where, 'I expected a linebreak after a function header.');
      }
      consume();
      const body = block();

      return new ExpressionFunctionDefinition(idToken.source, formals, body, SourceLocation.span(sourceStart, body.where));

    } else if (has(Token.If)) {
      let sourceStart = tokens[i].where;
      let sourceEnd = sourceStart;
      consume(); // eat if

      let conditions = [];
      let thenBlocks = [];
      let elseBlock = null;
      let isOneLiner;

      if (isFirstOfExpression()) {
        let condition = expression();

        let thenBlock;
        if (has(Token.Linebreak)) {
          consume(); // eat linebreak
          thenBlock = block();
          isOneLiner = false;
        } else if (has(Token.Then)) {
          consume(); // eat then
          thenBlock = expression();
          isOneLiner = true;
        } else {
          throw new LocatedException(sourceStart, 'I expected either a linebreak or then after the condition.');
        }

        conditions.push(condition);
        thenBlocks.push(thenBlock);
        sourceEnd = thenBlock.where;
      } else {
        throw new LocatedException(sourceStart, 'I expected a condition for this if.');
      }

      while ((isOneLiner && has(Token.ElseIf)) ||
             (!isOneLiner && has(Token.Indentation) && indents[indents.length - 1] === tokens[i].source.length && has(Token.ElseIf, 1))) {
        if (!isOneLiner) {
          consume(); // eat indent
        }
        let elseIfToken = tokens[i];
        consume(); // eat else if

        if (!isFirstOfExpression()) {
          throw new LocatedException(elseIfToken.where, 'I expected a condition after this else-if.');
        }

        let condition = expression();

        let thenBlock;
        if (has(Token.Linebreak)) {
          consume(); // eat linebreak
          thenBlock = block();
          isOneLiner = false;
        } else if (has(Token.Then)) {
          consume(); // eat then
          thenBlock = expression();
          isOneLiner = true;
        } else {
          throw new LocatedException(sourceStart, 'I expected either a linebreak or then after the condition.');
        }

        conditions.push(condition);
        thenBlocks.push(thenBlock);
        sourceEnd = thenBlock.where;
      }

      if (conditions.length === 0) {
        throw new LocatedException(sourceStart, 'I expected this if statement to have at least one condition.');
      }
      
      if ((isOneLiner && has(Token.Else)) ||
          (!isOneLiner && has(Token.Indentation) && indents[indents.length - 1] === tokens[i].source.length && has(Token.Else, 1))) {
        if (!isOneLiner) {
          consume(); // eat indentation
        }
        consume(); // eat else

        if (has(Token.Linebreak)) {
          consume(); // eat linebreak
          elseBlock = block();
          isOneLiner = false;
        } else {
          elseBlock = expression();
          isOneLiner = true;
        }

        sourceEnd = elseBlock.where;
      }

      return new ExpressionIf(conditions, thenBlocks, elseBlock, SourceLocation.span(sourceStart, sourceEnd));
    } else if (has(Token.While)) {
      let sourceStart = tokens[i].where;
      consume(); // eat while
      let condition = expression();
      if (!has(Token.Linebreak)) {
        throw new LocatedException(SourceLocation.span(sourceStart, condition.where), 'I expected a linebreak after this while\'s condition.');
      }
      consume(); // eat linebreak
      let body = block();
      return new ExpressionWhile(condition, body, SourceLocation.span(sourceStart, body.where));
    // } else if (has(Token.For)) {
      // let sourceStart = tokens[i].where;
      // consume();
      // if (isFirstOfExpression()) {
        // let j = expression();

        // for i in 0..10
        // for i to 10
        // for i through 10

        // let start;
        // let stop;
        // let by;
        
        // if (has(Token.In)) {
          // consume(); // eat in
          // start = expression();
          // if (has(Token.Range)) {
            // consume(); // eat ..
            // stop = expression();
            // stop = new ExpressionAdd(new ExpressionInteger(1), stop);
          // } else {
            // throw new LocatedException(SourceLocation.span(sourceStart, start.where), 'I expected the range operator .. in a for-in loop.');
          // }
        // } else if (has(Token.To)) {
          // consume(); // eat to
          // start = new ExpressionInteger(0);
          // stop = expression();
        // } else if (has(Token.Through)) {
          // consume(); // eat through
          // start = new ExpressionInteger(0);
          // stop = expression();
          // stop = new ExpressionAdd(new ExpressionInteger(1), stop);
        // } else {
          // throw new LocatedException(sourceStart, 'I expected one of to, through, or in to specify the for loop\'s range.');
        // }

        // if (has(Token.By)) {
          // consume(); // eat by
          // by = expression();
        // } else {
          // by = new ExpressionInteger(1);
        // }

        // if (!has(Token.Linebreak)) {
          // throw new LocatedException(SourceLocation.span(sourceStart, stop.where), 'I expected a linebreak after this loop\'s range.');
        // }
        // consume(); // eat linebreak
        // let body = block();

        // return new ExpressionFor(j, start, stop, by, body, SourceLocation.span(sourceStart, body.where));
      // }
    // } else if (has(Token.LeftSquareBracket)) {
      // let sourceStart = tokens[i].where;
      // consume(); // eat [
      // let elements = [];
      // while (!has(Token.RightSquareBracket)) {
        // let e = expression();
        // elements.push(e);
        // if (!has(Token.RightSquareBracket)) {
          // if (has(Token.Comma)) {
            // consume(); // eat ,
          // } else {
            // throw new LocatedException(tokens[i].where, 'I expected a comma between vector elements.');
          // }
        // }
      // }
      // let sourceEnd = tokens[i].where;
      // consume(); // eat ]
      // return new ExpressionVector(elements, SourceLocation.span(sourceStart, sourceEnd));
    // } else if (has(Token.Identifier) && has(Token.LeftParenthesis, 1)) {
      // let sourceStart = tokens[i].where;

      // let nameToken = consume();
      // consume(); // eat (

      // let actuals = [];
      // if (isFirstOfExpression()) {
        // actuals.push(expression());
        // while (has(Token.Comma) && isFirstOfExpression(1)) {
          // consume(); // eat ,
          // actuals.push(expression());
        // }
      // }

      // let sourceEnd = tokens[i].where;
      // if (has(Token.RightParenthesis)) {
        // consume();
      // } else {
        // throw new LocatedException(SourceLocation.span(sourceStart, sourceEnd), `I expected a right parenthesis to close the function call, but I encountered "${tokens[i].source}" (${tokens[i].type}) instead.`);
      // }

      // return new ExpressionFunctionCall(nameToken, actuals, SourceLocation.span(sourceStart, sourceEnd));
    // } else {
      // if (!has(Token.Linebreak)) {
        // throw new LocatedException(tokens[i].where, `I don't know what "${tokens[i].source}" means here.`);
      // }
    }
  }

  let ast = program();

  return ast;
}
