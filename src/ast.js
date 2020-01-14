import React from 'react';

// --------------------------------------------------------------------------- 

class Expression {
  constructor(precedence) {
    this.precedence = precedence;
  }

  get nextNonterminal() {
    return null;
  }

  // reactify(props) {
    // return (
      // <span className="subexpression">
        // {this.reactifyHelper(props)}
      // </span>
    // );
  // }
  
  simplify(expression, value) {
    if (expression === this) {
      return value;
    } else {
      return this;
    }
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

  reactify(props) {
    return (
      <span className={`subexpression ${props.isEvaluating && props.activeSubexpression === this ? 'active' : ''}`}>
        {this.a.reactify(props)}
        <span
          className={`operator ${this === props.hoveredSubexpression ? 'hovered' : ''} ${props.isShakingOperation && this === props.activeSubexpression ? 'shaking' : ''}`}
          onAnimationEnd={props.onStopShakingOperation}
          onMouseOver={e => !props.isEvaluating && props.onHover(e, this)}
          onMouseOut={e => props.onUnhover(e, this)}
          onClick={e => !props.isEvaluating && props.onClick(props.expression, this)}
        >{this.operator}</span>
        {this.b.reactify(props)}

        {props.isEvaluating && props.activeSubexpression === this && (
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
        )}
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
    super(10, '+', a, b);
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
    super(5, '*', a, b);
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

// --------------------------------------------------------------------------- 

class ExpressionLiteral extends Expression {
  constructor(value) {
    super(0, value);
    this.value = value;
  }

  evaluate() {
    return this;
  }

  equals(that) {
    return this.constructor === that.constructor && this.value === that.value;
  }

  reactify(props) {
    return (
      <span className="subexpression literal">
        {this.value}
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
