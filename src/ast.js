import React from 'react';

import {
  Mode,
  Precedence,
} from './constants';

// --------------------------------------------------------------------------- 

class Expression {
  constructor(precedence, where = null) {
    this.precedence = precedence;
    this.where = where;
  }

  getNextStatement(value, afterChild = null) {
    if (this.parent) {
      return this.parent.getNextStatement(value, this);
    } else {
      return null;
    }
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

  addSelectable(attributes, props, activeElement) {
    attributes.onMouseOver = event => props.onHover(event, this);
    attributes.onMouseOut = event => props.onUnhover(event, this);

    attributes.onClick = () => props.onClick(props.mode, this, activeElement);
    attributes.onAnimationEnd = () => props.onStopShaking(props.mode, this);

    if (this === props.hoveredElement) {
      attributes.className += ' hovered';
    }

    if (this === props.clickedElement && props.isBadSelection) {
      attributes.className += ' shaking';
    }
  }

  evaluatePopup(component, props) {
    if (props.mode === Mode.EvaluatingSubexpression && props.activeSubexpression === this) {
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
            spellCheck="false"
            className={props.isBadInput ? 'shaking' : ''}
            onAnimationEnd={props.onStopShaking}
            onChange={e => props.onEditInput(e.target.value)}
            value={props.currentInput}
            onKeyDown={e => props.onKeyDown(e, props.env, props.activeSubexpression, props.currentInput)}
          />
        </div>
      );
    } else {
      return null;
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionBlock extends Expression {
  constructor(statements, where) {
    super(Precedence.Atom, where);
    this.statements = statements;
    for (let child of this.statements) {
      child.parent = this;
    }
  }

  getNextStatement(value, afterChild) {
    const index = this.statements.indexOf(afterChild);
    if (index < this.statements.length - 1) {
      return this.statements[index + 1];
    } else {
      return super.getNextStatement();
    }
  }

  programify(component, props, isParenthesized, isSelectable) {
    return (
      <div className="block">
        {this.statements.map((statement, i) => <div className="statement" key={`statement-${i}`}>{statement.programify(component, props, false, true)}</div>)}
      </div>
    );
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionIdentifier extends Expression {
  constructor(id, where = null) {
    super(Precedence.Atom, where);
    this.id = id;
  }

  evaluatorify(component, props, isParenthesized) {
    let attributes = {className: 'subexpression'};
    this.addSelectable(attributes, props, props.expression);

    const identifierElement = React.createElement('span', attributes, this.id.source);
    return (
      <span className={`subexpression ${props.mode === Mode.EvaluatingSubexpression && props.activeSubexpression === this ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {identifierElement}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(component, props)}
      </span>
    );
  }

  get nextNonterminal() {
    return this;
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return this;
    }
  }

  clone() {
    return new this.constructor(this.id, this.where);
  }

  programify(component, props, isParenthesized, isSelectable) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement);
    }

    return React.createElement('span', attributes, 
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span className="expression-piece">{this.id.source}</span>
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );
  }

  evaluate(env) {
    return env.variables.find(variable => variable.name === this.id.source).current;
  }
}

// --------------------------------------------------------------------------- 

class ExpressionUnaryOperator extends Expression {
  constructor(precedence, operator, a, where = null) {
    super(precedence, where);
    this.a = a;
    this.operator = operator;
    this.a.parent = this;
  }

  evaluatorify(component, props, isParenthesized) {
    // let operatorElement;
    // if (props.mode === Mode.SelectingSubexpression) {
      // operatorElement = <span
        // className={`evaluatable unary-prefix-operator expression-piece ${this === props.hoveredElement ? 'hovered' : ''} ${props.isShaking && this === props.clickedElement ? 'shaking' : ''}`}
        // onAnimationEnd={props.onStopShakingOperation}
        // onMouseOver={e => props.mode === Mode.SelectingSubexpression && props.onHover(e, this)}
        // onMouseOut={e => props.onUnhover(e, this)}
        // onClick={e => props.mode === Mode.SelectingSubexpression && props.onClickOperator(props.expression, this)}
      // >{this.operator}</span>;
    // } else {
      // operatorElement = <span className="unary-prefix-operator expression-piece">{this.operator}</span>;
    // }

    let attributes = {className: 'evaluatable unary-prefix-operator expression-piece'};
    this.addSelectable(attributes, props, props.expression);

    const operatorElement = React.createElement('span', attributes, this.operator);
    return (
      <span className={`subexpression ${props.mode === Mode.EvaluatingSubexpression && props.activeSubexpression === this ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {operatorElement}
        {this.a.evaluatorify(component, props, this.precedence > this.a.precedence)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(component, props)}
      </span>
    );
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new this.constructor(this.a.simplify(expression, value));
    }
  }

  clone() {
    return new this.constructor(this.a.clone(), this.where);
  }

  get nextNonterminal() {
    let node = this.a.nextNonterminal;
    if (!node) {
      node = this;
    }
    return node;
  }

  programify(component, props, isParenthesized, isSelectable) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement);
    }

    return React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span className="unary-prefix-operator expression-piece">{this.operator}</span>
        {this.a.programify(component, props, this.precedence > this.a.precedence, false)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );
  }
}

// --------------------------------------------------------------------------- 

class ExpressionBinaryOperator extends Expression {
  constructor(precedence, operator, a, b, where = null) {
    super(precedence, where);
    this.a = a;
    this.b = b;
    this.operator = operator;
    this.a.parent = this;
    this.b.parent = this;
  }

  evaluatorify(component, props, isParenthesized) {
    // let operatorElement;
    // if (props.mode === Mode.SelectingSubexpression) {
      // operatorElement = <span
        // className={`evaluatable binary-infix-operator expression-piece ${this === props.hoveredElement ? 'hovered' : ''} ${props.isShaking && this === props.clickedElement ? 'shaking' : ''}`}
        // onAnimationEnd={props.onStopShakingOperation}
        // onMouseOver={e => props.onHover(e, this)}
        // onMouseOut={e => props.onUnhover(e, this)}
        // onClick={e => props.onClickOperator(props.expression, this)}
      // >{this.operator}</span>
    // } else {
      // operatorElement = <span className="binary-infix-operator expression-piece">{this.operator}</span>;
    // }

    let attributes = {className: 'evaluatable binary-infix-operator expression-piece'};
    this.addSelectable(attributes, props, props.expression);

    const operatorElement = React.createElement('span', attributes, this.operator);
    return (
      <span className={`subexpression ${props.mode === Mode.EvaluatingSubexpression && props.activeSubexpression === this ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.a.evaluatorify(component, props, this.precedence > this.a.precedence)}
        {operatorElement}
        {this.b.evaluatorify(component, props, this.precedence >= this.b.precedence)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(component, props)}
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

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new this.constructor(this.a.simplify(expression, value), this.b.simplify(expression, value));
    }
  }

  clone() {
    return new this.constructor(this.a.clone(), this.b.clone(), this.where);
  }

  programify(component, props, isParenthesized, isSelectable) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement);
    }

    return React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.a.programify(component, props, this.precedence > this.a.precedence, false)}
        <span className="binary-infix-operator expression-piece">{this.operator}</span>
        {this.b.programify(component, props, this.precedence >= this.b.precedence, false)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );
  }
}

export class ExpressionAssignment extends Expression {
  constructor(identifier, value, where) {
    super(Precedence.Assignment, where);
    this.identifier = identifier;
    this.value = value;
    this.value.parent = this;
  }

  evaluatorify(component, props, isParenthesized) {
    // let operatorElement;
    // if (props.mode === Mode.SelectingSubexpression) {
      // operatorElement = <span
        // className={`evaluatable binary-infix-operator expression-piece ${this === props.hoveredElement ? 'hovered' : ''} ${props.isShaking && this === props.clickedElement ? 'shaking' : ''}`}
        // onAnimationEnd={props.onStopShakingOperation}
        // onMouseOver={e => props.onHover(e, this)}
        // onMouseOut={e => props.onUnhover(e, this)}
        // onClick={e => props.onClickAssignment(props.expression, this)}
      // >=</span>;
    // } else {
      // operatorElement = <span className="binary-infix-operator expression-piece">=</span>;
    // }

    let attributes = {className: 'evaluatable binary-infix-operator expression-piece'};
    this.addSelectable(attributes, props, props.expression);

    const operatorElement = React.createElement('span', attributes, '=');
    return (
      <span className={`subexpression ${props.mode === Mode.EvaluatingSubexpression && props.activeSubexpression === this ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.identifier.source}
        {operatorElement}
        {this.value.evaluatorify(component, props, this.precedence > this.value.precedence)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(component, props)}
      </span>
    );
  }

  get nextNonterminal() {
    let node = this.value.nextNonterminal;
    if (!node) {
      node = this;
    }
    return node;
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new this.constructor(this.identifier, this.value.simplify(expression, value));
    }
  }

  clone() {
    return new this.constructor(this.identifier, this.value.clone(), this.where);
  }

  programify(component, props, isParenthesized, isSelectable) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement);
    }

    return React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.identifier.source}
        <span className="binary-infix-operator expression-piece">=</span>
        {this.value.programify(component, props, this.precedence > this.value.precedence, false)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );
  }
}

export class ExpressionAdd extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Additive, '+', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

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
}

export class ExpressionMultiply extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Multiplicative, '*', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(valueA.value * valueB.value);
    } else if ((valueA instanceof ExpressionReal && valueB instanceof ExpressionInteger) ||
               (valueB instanceof ExpressionReal && valueA instanceof ExpressionInteger)) {
      return new ExpressionReal(valueA.value * valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

export class ExpressionModulus extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Multiplicative, '%', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(valueA.value % valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

export class ExpressionDivide extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Multiplicative, '/', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(Math.floor(valueA.value / valueB.value));
    } else if ((valueA instanceof ExpressionReal && valueB instanceof ExpressionInteger) ||
               (valueB instanceof ExpressionReal && valueA instanceof ExpressionInteger)) {
      return new ExpressionReal(valueA.value / valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

export class ExpressionLeftShift extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Shift, '<<', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(valueA.value << valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

export class ExpressionRightShift extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Shift, '>>', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(valueA.value >> valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionAnd extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.And, '&&', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionBoolean && valueB instanceof ExpressionBoolean) {
      return new ExpressionBoolean(valueA.value && valueB.value);
    } else {
      throw new Error('bad types');
    }
  }

  get nextNonterminal() {
    // If a is literal false, we don't consider b.
    let node = this.a.nextNonterminal;
    if (!node) {
      if (this.a.equals(new ExpressionBoolean(false))) {
        node = this;
      } else {
        node = this.b.nextNonterminal;
        if (!node) {
          node = this;
        }
      }
    }
    return node;
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionOr extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Or, '||', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionBoolean && valueB instanceof ExpressionBoolean) {
      return new ExpressionBoolean(valueA.value || valueB.value);
    } else {
      throw new Error('bad types');
    }
  }

  get nextNonterminal() {
    // If a is literal false, we don't consider b.
    let node = this.a.nextNonterminal;
    if (!node) {
      if (this.a.equals(new ExpressionBoolean(true))) {
        node = this;
      } else {
        node = this.b.nextNonterminal;
        if (!node) {
          node = this;
        }
      }
    }
    return node;
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionMore extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Relational, '>', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if ((valueA instanceof ExpressionInteger || valueA instanceof ExpressionReal) &&
        (valueB instanceof ExpressionInteger || valueB instanceof ExpressionReal)) {
      return new ExpressionBoolean(valueA.value > valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionMoreEqual extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Relational, '>=', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if ((valueA instanceof ExpressionInteger || valueA instanceof ExpressionReal) &&
        (valueB instanceof ExpressionInteger || valueB instanceof ExpressionReal)) {
      return new ExpressionBoolean(valueA.value >= valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionLess extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Relational, '<', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if ((valueA instanceof ExpressionInteger || valueA instanceof ExpressionReal) &&
        (valueB instanceof ExpressionInteger || valueB instanceof ExpressionReal)) {
      return new ExpressionBoolean(valueA.value < valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionLessEqual extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Relational, '<=', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if ((valueA instanceof ExpressionInteger || valueA instanceof ExpressionReal) &&
        (valueB instanceof ExpressionInteger || valueB instanceof ExpressionReal)) {
      return new ExpressionBoolean(valueA.value <= valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionNot extends ExpressionUnaryOperator {
  constructor(a, where) {
    super(Precedence.Not, '!', a, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);

    if (valueA instanceof ExpressionBoolean) {
      return new ExpressionBoolean(!valueA.value);
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionSame extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Equality, '==', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA.constructor === valueB.constructor) {
      return new ExpressionBoolean(valueA.value === valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionNotSame extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Equality, '!=', a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA.constructor === valueB.constructor) {
      return new ExpressionBoolean(valueA.value !== valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

class ExpressionLiteral extends Expression {
  constructor(value, where) {
    super(Precedence.Atom, where);
    this.value = value;
  }

  clone() {
    return new this.constructor(this.value, this.where);
  }

  evaluate(env) {
    return this;
  }

  equals(that) {
    return this.constructor === that.constructor && this.value === that.value;
  }

  evaluatorify(component, props, isParenthesized) {
    return (
      <span className="subexpression expression-piece literal">{this.value.toString()}</span>
    );
  }

  programify(component, props, isParenthesized, isSelectable) {
    let attributes = {className: 'subexpression expression-piece literal'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement);
    }

    return React.createElement('span', attributes, this.value.toString());
  }
}

export class ExpressionInteger extends ExpressionLiteral {
}

export class ExpressionReal extends ExpressionLiteral {
}

export class ExpressionString extends ExpressionLiteral {
}

export class ExpressionBoolean extends ExpressionLiteral {
}

// --------------------------------------------------------------------------- 

export function parseLiteral(expression) {
  if (expression.match(/^-?\d+$/)) {
    return new ExpressionInteger(parseInt(expression));
  } else if (expression.match(/^-?(\d+\.\d*|\d*.\d+)$/)) {
    return new ExpressionReal(parseFloat(expression));
  } else if (expression.match(/^true$/)) {
    return new ExpressionBoolean(true);
  } else if (expression.match(/^false$/)) {
    return new ExpressionBoolean(false);
  } else if (expression.match(/^".*"$/)) {
    return new ExpressionString(expression.slice(1, -1));
  } else {
    return new ExpressionString(expression);
  }
}

// --------------------------------------------------------------------------- 

