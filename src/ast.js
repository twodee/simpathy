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
      <span className={`subexpression ${props.activeSubexpression === this ? 'active' : ''}`}>
        {this.a.reactify(props)}
        <span
          className={`operator ${this === props.hoveredSubexpression ? 'hovered' : ''}`}
          onMouseOver={e => props.onHover(e, this)}
          onMouseOut={e => props.onUnhover(e, this)}
          onClick={e => props.onClick(props.expression, this)}
        >{this.operator}</span>
        {this.b.reactify(props)}

        {props.activeSubexpression === this && (
          <div className="evaluate-box">
            <input type="text" />
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
}

export class ExpressionMultiply extends ExpressionBinaryOperator {
  constructor(a, b) {
    super(5, '*', a, b);
  }
}

// --------------------------------------------------------------------------- 

class ExpressionLiteral extends Expression {
  constructor(value) {
    super(0, value);
    this.value = value;
  }

  reactify(props) {
    return (
      <span className="literal">
        {this.value}
      </span>
    )
  }
}

export class ExpressionInteger extends ExpressionLiteral {
  constructor(value) {
    super(value);
  }
}

export class ExpressionReal extends ExpressionLiteral {
  constructor(value) {
    super(value);
  }
}
