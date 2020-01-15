import React from 'react';

const Precedence = Object.freeze({
  Atom: 100,
  Not: 90,
  Multiplicative: 80,
  Additive: 70,
  And: 60,
  Or: 59,
});
// --------------------------------------------------------------------------- 

class Expression {
  constructor(precedence) {
    this.precedence = precedence;
  }

  get nextNonterminal() {
    return null;
  }

  simplify(expression, value) {
    if (expression === this) {
      return value;
    } else {
      return this;
    }
  }

  evaluatePopup(props) {
    if (props.isEvaluating && props.activeSubexpression === this) {
      return (
        <div className="evaluate-popup">
          <svg height="12" width="16">
            <polygon points="8,12 0,0 16,0" />
          </svg>
          <input
            id="evaluate-box"
            type="text"
            size="8"
            autoFocus
            autoComplete="off"
            className={props.isShakingEvaluation ? 'shaking' : ''}
            onAnimationEnd={props.onStopShakingEvaluation}
            onChange={e => props.onEditValue(e.target.value)}
            value={props.value}
            onKeyDown={e => props.onKeyDown(e, props.activeSubexpression, props.value)}
          />
        </div>
      );
    } else {
      return null;
    }
  }
}

// --------------------------------------------------------------------------- 

class ExpressionUnaryOperator extends Expression {
  constructor(precedence, operator, a) {
    super(precedence);
    this.a = a;
    this.operator = operator;
  }

  reactify(props, isParenthesized) {
    return (
      <span className={`subexpression ${props.isEvaluating && props.activeSubexpression === this ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span
          className={`operator unary-prefix-operator expression-piece ${this === props.hoveredSubexpression ? 'hovered' : ''} ${props.isShakingOperation && this === props.activeSubexpression ? 'shaking' : ''}`}
          onAnimationEnd={props.onStopShakingOperation}
          onMouseOver={e => !props.isEvaluating && props.onHover(e, this)}
          onMouseOut={e => props.onUnhover(e, this)}
          onClick={e => !props.isEvaluating && props.onClick(props.expression, this)}
        >{this.operator}</span>
        {this.a.reactify(props, this.precedence >= this.a.precedence)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(props)}
      </span>
    )
  }

  get nextNonterminal() {
    let node = this.a.nextNonterminal;
    if (!node) {
      node = this;
    }
    return node;
  }
}

// --------------------------------------------------------------------------- 

class ExpressionBinaryOperator extends Expression {
  constructor(precedence, operator, a, b) {
    super(precedence);
    this.a = a;
    this.b = b;
    this.operator = operator;
  }

  reactify(props, isParenthesized) {
    return (
      <span className={`subexpression ${props.isEvaluating && props.activeSubexpression === this ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.a.reactify(props, this.precedence > this.a.precedence)}
        <span
          className={`operator binary-infix-operator expression-piece ${this === props.hoveredSubexpression ? 'hovered' : ''} ${props.isShakingOperation && this === props.activeSubexpression ? 'shaking' : ''}`}
          onAnimationEnd={props.onStopShakingOperation}
          onMouseOver={e => !props.isEvaluating && props.onHover(e, this)}
          onMouseOut={e => props.onUnhover(e, this)}
          onClick={e => !props.isEvaluating && props.onClick(props.expression, this)}
        >{this.operator}</span>
        {this.b.reactify(props, this.precedence >= this.b.precedence)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(props)}
      </span>
    )
  }

  get nextNonterminal() {
    let node = this.a.nextNonterminal;
    if (!node) {
      node = this.b.nextNonterminal;
      if (!node) {
        node = this;
      }
    }
    return node;
  }
}

export class ExpressionAdd extends ExpressionBinaryOperator {
  constructor(a, b) {
    super(70, '+', a, b);
  }

  evaluate() {
    const valueA = this.a.evaluate();
    const valueB = this.b.evaluate();

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(valueA.value + valueB.value);
    } else if (valueA instanceof ExpressionString || valueB instanceof ExpressionString) {
      return new ExpressionString(valueA.value + valueB.value);
    } else if ((valueA instanceof ExpressionReal && valueB instanceof ExpressionInteger) ||
               (valueB instanceof ExpressionReal && valueA instanceof ExpressionInteger)) {
      return new ExpressionReal(valueA.value + valueB.value);
    } else {
      throw new Error('bad types');
    }
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new ExpressionAdd(this.a.simplify(expression, value), this.b.simplify(expression, value));
    }
  }
}

export class ExpressionMultiply extends ExpressionBinaryOperator {
  constructor(a, b) {
    super(Precedence.Multiplicative, '*', a, b);
  }

  evaluate() {
    const valueA = this.a.evaluate();
    const valueB = this.b.evaluate();

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(valueA.value * valueB.value);
    } else if ((valueA instanceof ExpressionReal && valueB instanceof ExpressionInteger) ||
               (valueB instanceof ExpressionReal && valueA instanceof ExpressionInteger)) {
      return new ExpressionReal(valueA.value * valueB.value);
    } else {
      throw new Error('bad types');
    }
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new ExpressionMultiply(this.a.simplify(expression, value), this.b.simplify(expression, value));
    }
  }
}

export class ExpressionModulus extends ExpressionBinaryOperator {
  constructor(a, b) {
    super(Precedence.Multiplicative, '%', a, b);
  }

  evaluate() {
    const valueA = this.a.evaluate();
    const valueB = this.b.evaluate();

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(valueA.value % valueB.value);
    } else {
      throw new Error('bad types');
    }
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new ExpressionModulus(this.a.simplify(expression, value), this.b.simplify(expression, value));
    }
  }
}

export class ExpressionDivide extends ExpressionBinaryOperator {
  constructor(a, b) {
    super(Precedence.Multiplicative, '/', a, b);
  }

  evaluate() {
    const valueA = this.a.evaluate();
    const valueB = this.b.evaluate();

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(Math.floor(valueA.value / valueB.value));
    } else if ((valueA instanceof ExpressionReal && valueB instanceof ExpressionInteger) ||
               (valueB instanceof ExpressionReal && valueA instanceof ExpressionInteger)) {
      return new ExpressionReal(valueA.value / valueB.value);
    } else {
      throw new Error('bad types');
    }
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new ExpressionDivide(this.a.simplify(expression, value), this.b.simplify(expression, value));
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionAnd extends ExpressionBinaryOperator {
  constructor(a, b) {
    super(Precedence.And, '&&', a, b);
  }

  evaluate() {
    const valueA = this.a.evaluate();
    const valueB = this.b.evaluate();

    if (valueA instanceof ExpressionBoolean && valueB instanceof ExpressionBoolean) {
      return new ExpressionBoolean(valueA.value && valueB.value);
    } else {
      throw new Error('bad types');
    }
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new ExpressionAnd(this.a.simplify(expression, value), this.b.simplify(expression, value));
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionOr extends ExpressionBinaryOperator {
  constructor(a, b) {
    super(Precedence.Or, '||', a, b);
  }

  evaluate() {
    const valueA = this.a.evaluate();
    const valueB = this.b.evaluate();

    if (valueA instanceof ExpressionBoolean && valueB instanceof ExpressionBoolean) {
      return new ExpressionBoolean(valueA.value || valueB.value);
    } else {
      throw new Error('bad types');
    }
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new ExpressionOr(this.a.simplify(expression, value), this.b.simplify(expression, value));
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionNot extends ExpressionUnaryOperator {
  constructor(a) {
    super(Precedence.Not, '!', a);
  }

  evaluate() {
    const valueA = this.a.evaluate();

    if (valueA instanceof ExpressionBoolean) {
      return new ExpressionBoolean(!valueA.value);
    } else {
      throw new Error('bad types');
    }
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new ExpressionNot(this.a.simplify(expression, value));
    }
  }
}

// --------------------------------------------------------------------------- 

class ExpressionLiteral extends Expression {
  constructor(value) {
    super(Precedence.Atom, value);
    this.value = value;
  }

  evaluate() {
    return this;
  }

  equals(that) {
    return this.constructor === that.constructor && this.value === that.value;
  }

  reactify(props, isParenthesized) {
    return (
      <span className="subexpression expression-piece literal">
        {'' + this.value}
      </span>
    )
  }
}

export class ExpressionInteger extends ExpressionLiteral {
  // constructor(value) {
    // super(value);
  // }
}

export class ExpressionReal extends ExpressionLiteral {
  // constructor(value) {
    // super(value);
  // }
}

export class ExpressionString extends ExpressionLiteral {
  // constructor(value) {
    // super(value);
  // }
}

export class ExpressionBoolean extends ExpressionLiteral {
  // constructor(value) {
    // super(value);
  // }
}
