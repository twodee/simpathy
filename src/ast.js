import React from 'react';

import {
  Mode,
  Precedence,
} from './constants';

// --------------------------------------------------------------------------- 

export class TreeStepper {
  constructor(tree) {
    this.tree = tree;
    this.stack = [this.tree.stepper()];
  }

  next(bequest) {
    while (this.stack.length > 0) {
      let stepper = this.stack[this.stack.length - 1];
      let result = stepper.next(bequest);
      if (result === null) {
        this.stack.pop();
      } else if (result instanceof Stepper) {
        this.stack.push(result);
      } else {
        return result;
      }
    }

    return null;
  }
}

// --------------------------------------------------------------------------- 

class Stepper {
  constructor(expression) {
    this.expression = expression;
    this.i = -1;
  }

  next(bequest) {
    this.i += 1;
  }
}

class ExpressionStepper extends Stepper {
  next(bequest) {
    super.next(bequest);
    if (this.i === 0) {
      return this.expression;
    } else {
      return null;
    }
  }
}

class BlockStepper extends Stepper {
  next(bequest) {
    super.next(bequest);
    if (this.i < this.expression.statements.length) {
      return this.expression.statements[this.i].stepper();
    } else {
      return null;
    }
  }
}

class IfStepper extends Stepper {
  next(bequest) {
    super.next(bequest);
    // 0 -> condition 0 always
    // 1 -> then 0 if bequest is true, condition 1 if bequest is false
    // 2 -> then 1 if bequest is true, condition 2 if bequest is false
    // i -> then i - 1 if bequest is true, condition i or else if bequest is false

    if (this.i === 0) {
      return this.expression.conditions[0].stepper();
    } else if (bequest.value && this.i <= this.expression.thenBlocks.length) {
      return this.expression.thenBlocks[this.i - 1].stepper();
    } else if (!bequest.value && this.i < this.expression.conditions.length) {
      return this.expression.conditions[this.i].stepper();
    } else if (!bequest.value && this.i === this.expression.conditions.length) {
      return this.expression.elseBlock.stepper();
    } else {
      return null;
    }
  }
}

// --------------------------------------------------------------------------- 

class Expression {
  constructor(precedence, where = null) {
    this.precedence = precedence;
    this.where = where;
  }

  getFirstStatement() {
    return this;
  }
  
  stepper() {
    return new ExpressionStepper(this);
  }

  getNextStatement(value, afterChild = null) {
    if (this.parent) {
      const next = this.parent.getNextStatement(value, this);
      if (next) {
        return next.getFirstStatement();
      } else {
        return null;
      }
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

  addSelectable(attributes, props, ...extras) {
    attributes.onMouseOver = event => props.onHover(event, this);
    attributes.onMouseOut = event => props.onUnhover(event, this);

    attributes.onClick = () => props.onClick(props.mode, this, ...extras);
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
            className={`code ${props.isBadInput ? 'shaking' : ''}`}
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

  isSimplified() {
    return false;
  }

  getFirstStatement() {
    if (this.statements.length > 0) {
      return this.statements[0].getFirstStatement();
    } else {
      return null;
    }
  }

  getNextStatement(value, afterChild) {
    const index = afterChild ? this.statements.indexOf(afterChild) : 0;
    if (index < this.statements.length - 1) {
      return this.statements[index + 1];
    } else {
      return super.getNextStatement();
    }
  }
  
  stepper() {
    return new BlockStepper(this);
  }

  programify(component, props, isParenthesized, isSelectable, indentation) {
    return (
      <div className="block">
        {this.statements.map((statement, i) => <div className="statement" key={`statement-${i}`}>{statement.programify(component, props, false, true, indentation)}</div>)}
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

  isSimplified() {
    return false;
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

  programify(component, props, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement, props.program, props.expression);
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

  isSimplified() {
    return false;
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

  programify(component, props, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement, props.program, props.expression);
    }

    const element = React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span className="unary-prefix-operator expression-piece">{this.operator}</span>
        {this.a.programify(component, props, this.precedence > this.a.precedence, false, '')}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );

    return (
      <>
        <span className="indentation">{indentation}</span>
        {element}
      </>
    );
  }
}

// --------------------------------------------------------------------------- 

class ExpressionBinaryOperator extends Expression {
  constructor(precedence, operator, isLeftAssociative, a, b, where = null) {
    super(precedence, where);
    this.a = a;
    this.b = b;
    this.operator = operator;
    this.a.parent = this;
    this.b.parent = this;
  }

  isSimplified() {
    return false;
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
        {this.a.evaluatorify(component, props, this.isLeftAssociative ? this.precedence > this.a.precedence : this.precedence >= this.a.precedence)}
        {operatorElement}
        {this.b.evaluatorify(component, props, this.isLeftAssociative ? this.precedence >= this.b.precedence : this.precedence > this.b.precedence)}
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

  programify(component, props, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement, props.program, props.expression);
    }

    const element = React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.a.programify(component, props, this.isLeftAssociative ? this.precedence > this.a.precedence : this.precedence >= this.a.precedence, false, '')}
        <span className="binary-infix-operator expression-piece">{this.operator}</span>
        {this.b.programify(component, props, this.isLeftAssociative ? this.precedence >= this.b.precedence : this.precedence > this.b.precedence, false, '')}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );

    return (
      <>
        <span className="indentation">{indentation}</span>
        {element}
      </>
    );
  }
}

// --------------------------------------------------------------------------- 

class ExpressionBuiltin extends Expression {
  constructor(name, operands, where = null) {
    super(Precedence.Atom, where);
    this.operands = operands;
    this.name = name;
    for (let operand of this.operands) {
      operand.parent = this;
    }
  }

  isSimplified() {
    return false;
  }

  get nextNonterminal() {
    for (let operand of this.operands) {
      let node = operand.nextNonterminal;
      if (node) {
        return node;
      }
    }
    return this;
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new this.constructor(this.operands.map(operand => operand.simplify(expression, value)));
    }
  }

  clone() {
    return new this.constructor(this.operands.map(operand => operand.clone()), this.where);
  }

  evaluatorify(component, props, isParenthesized) {
    let attributes = {className: 'evaluatable function-call expression-piece'};
    this.addSelectable(attributes, props, props.expression);

    const callElement = React.createElement('span', attributes, this.name);
    return (
      <span className={`subexpression ${props.mode === Mode.EvaluatingSubexpression && props.activeSubexpression === this ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {callElement}({
          this.operands.map((operand, i) => (
            <React.Fragment key={`operand-${i}`}>
              {i > 0 ? ', ' : ''}
              {operand.evaluatorify(component, props, false)}
            </React.Fragment>
          ))
        })
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(component, props)}
      </span>
    )
  }

  programify(component, props, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement, props.program, props.expression);
    }

    const element = React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.name}({
          this.operands.map((operand, i) => (
            <React.Fragment key={`operand-${i}`}>
              {i > 0 ? ', ' : ''}
              {operand.programify(component, props, false, '')}
            </React.Fragment>
          ))
        })
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );

    return (
      <>
        <span className="indentation">{indentation}</span>
        {element}
      </>
    );
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionIf extends Expression {
  constructor(conditions, thenBlocks, elseBlock, where = null) {
    super(Precedence.Atom, where);
    this.conditions = conditions;
    this.thenBlocks = thenBlocks;
    this.elseBlock = elseBlock;
    for (let condition of this.conditions) {
      condition.parent = this;
    }
    for (let thenBody of this.thenBlocks) {
      thenBody.parent = this;
    }
    this.elseBlock.parent = this;
  }

  isSimplified() {
    return false;
  }
  
  stepper() {
    return new IfStepper(this);
  }

  getFirstStatement() {
    return this.conditions[0].getFirstStatement();
  }

  getNextStatement(value, afterChild) {
    // Walk through conditions. If the child is one of them and the condition
    // is true, we jump to the first statement of the associated block. If the
    // child is one of them but the condition is not true, we jump to the next
    // condition or the else block.
    for (const [i, condition] of this.conditions.entries()) {
      if (condition === afterChild) {
        if (value.value) {
          return this.thenBlocks[i].getFirstStatement();
        } else if (i < this.conditions.length - 1) {
          return this.conditions[i + 1].getFirstStatement();
        } else if (this.elseBlock) {
          return this.elseBlock.getFirstStatement();
        }
      }
    }

    return super.getNextStatement();
  }

  programify(component, props, isParenthesized, isSelectable, indentation) {
    return (
      <span>
        <span className="indentation">{indentation}</span>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        if ({this.conditions[0].programify(component, props, false, true, '')})
          {this.thenBlocks[0].programify(component, props, false, false, indentation + '  ')}
        <span className="indentation">{indentation}</span>
        else
          {this.elseBlock.programify(component, props, false, false, indentation + '  ')}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </span>
    );
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionMax extends ExpressionBuiltin {
  constructor(operands, where) {
    super('max', operands, where);
  }

  evaluate(env) {
    const values = this.operands.map(operand => operand.evaluate(env));

    if (values.every(value => value instanceof ExpressionInteger)) {
      return new ExpressionInteger(Math.max(...values.map(value => value.value)));
    } else if (values.every(value => value instanceof ExpressionInteger || value instanceof ExpressionReal)) {
      return new ExpressionReal(Math.max(...values.map(value => value.value)));
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionMin extends ExpressionBuiltin {
  constructor(operands, where) {
    super('min', operands, where);
  }

  evaluate(env) {
    const values = this.operands.map(operand => operand.evaluate(env));

    if (values.every(value => value instanceof ExpressionInteger)) {
      return new ExpressionInteger(Math.min(...values.map(value => value.value)));
    } else if (values.every(value => value instanceof ExpressionInteger || value instanceof ExpressionReal)) {
      return new ExpressionReal(Math.min(...values.map(value => value.value)));
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionSign extends ExpressionBuiltin {
  constructor(operands, where) {
    super('sign', operands, where);
  }

  evaluate(env) {
    const value = this.operands[0].evaluate(env);
    if (value instanceof ExpressionInteger || value instanceof ExpressionReal) {
      return new ExpressionInteger(value.value > 0 ? 1 : (value.value < 0 ? -1 : 0));
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionPrint extends ExpressionBuiltin {
  constructor(operands, where) {
    super('print', operands, where);
  }

  evaluate(env) {
    const values = this.operands.map(operand => operand.evaluate(env).value).join(' ');
    console.log(values);
    return new ExpressionUnit();
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionAssignment extends Expression {
  constructor(identifier, value, where) {
    super(Precedence.Assignment, where);
    this.identifier = identifier;
    this.value = value;
    this.value.parent = this;
  }

  isSimplified() {
    return false;
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

  programify(component, props, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement, props.program, props.expression);
    }

    const element = React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.identifier.source}
        <span className="binary-infix-operator expression-piece">=</span>
        {this.value.programify(component, props, this.precedence > this.value.precedence, false, '')}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );

    return (
      <>
        <span className="indentation">{indentation}</span>
        {element}
      </>
    );
  }
}

export class ExpressionPower extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Power, '**', false, a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(Math.pow(valueA.value, valueB.value));
    } else if ((valueA instanceof ExpressionReal || valueA instanceof ExpressionInteger) &&
               (valueB instanceof ExpressionReal || valueB instanceof ExpressionInteger)) {
      return new ExpressionReal(Math.pow(valueA.value, valueB.value));
    } else {
      throw new Error('bad types');
    }
  }
}

export class ExpressionAdd extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Additive, '+', true, a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(valueA.value + valueB.value);
    } else if (valueA instanceof ExpressionString || valueB instanceof ExpressionString) {
      return new ExpressionString(valueA.value + valueB.value);
    } else if ((valueA instanceof ExpressionReal || valueA instanceof ExpressionInteger) &&
               (valueB instanceof ExpressionReal || valueB instanceof ExpressionInteger)) {
      return new ExpressionReal(valueA.value + valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

export class ExpressionMultiply extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Multiplicative, '*', true, a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(valueA.value * valueB.value);
    } else if ((valueA instanceof ExpressionReal || valueA instanceof ExpressionInteger) &&
               (valueB instanceof ExpressionReal || valueB instanceof ExpressionInteger)) {
      return new ExpressionReal(valueA.value * valueB.value);
    } else {
      throw new Error('bad types');
    }
  }
}

export class ExpressionModulus extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Multiplicative, '%', true, a, b, where);
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
    super(Precedence.Multiplicative, '/', true, a, b, where);
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
    super(Precedence.Shift, '<<', true, a, b, where);
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
    super(Precedence.Shift, '>>', true, a, b, where);
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
    super(Precedence.And, '&&', true, a, b, where);
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
    super(Precedence.Or, '||', true, a, b, where);
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
    super(Precedence.Relational, '>', true, a, b, where);
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
    super(Precedence.Relational, '>=', true, a, b, where);
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
    super(Precedence.Relational, '<', true, a, b, where);
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
    super(Precedence.Relational, '<=', true, a, b, where);
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
    super(Precedence.Equality, '==', true, a, b, where);
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
    super(Precedence.Equality, '!=', true, a, b, where);
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

export class ExpressionLiteral extends Expression {
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

  isSimplified() {
    return true;
  }

  equals(that) {
    return this.constructor === that.constructor && this.value === that.value;
  }

  evaluatorify(component, props, isParenthesized) {
    return (
      <span className="subexpression expression-piece literal">{this.value.toString()}</span>
    );
  }

  programify(component, props, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression expression-piece literal'};
    if (isSelectable) {
      this.addSelectable(attributes, props, props.activeStatement, props.program, props.expression);
    }

    const element = React.createElement('span', attributes, this.value.toString());
    return (
      <>
        <span className="indentation">{indentation}</span>
        {element}
      </>
    );
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

export class ExpressionUnit extends Expression {
  constructor(where) {
    super(Precedence.Atom, where);
  }

  clone() {
    return new this.constructor(this.where);
  }

  evaluate(env) {
    return this;
  }

  isSimplified() {
    return true;
  }

  equals(that) {
    return this.constructor === that.constructor;
  }

  evaluatorify(component, props, isParenthesized) {
    return null;
  }

  programify(component, props, isParenthesized, isSelectable, indentation) {
    return null;
  }
}

// --------------------------------------------------------------------------- 

export function parseLiteral(expression) {
  if (expression.match(/^-?\d+$/)) {
    return new ExpressionInteger(parseInt(expression));
  } else if (expression.match(/^$/)) {
    return new ExpressionUnit();
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

