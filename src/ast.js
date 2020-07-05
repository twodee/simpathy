import React from 'react';

import {
  Mode,
  Precedence,
} from './constants';

import {
  editInput,
  hover,
  unhover,
  stopShaking,
} from './actions';

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
    let stepper = null;

    while (!stepper && this.i < this.expression.statements.length) {
      super.next(bequest);
      if (this.i < this.expression.statements.length) {
        stepper = this.expression.statements[this.i].stepper();
      }
    }

    return stepper;
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

class WhileStepper extends Stepper {
  next(bequest) {
    super.next(bequest);

    if (this.i % 2 === 0) {
      return this.expression.condition.stepper();
    } else if (bequest.value) {
      return this.expression.body.stepper();
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

  addSelectable(attributes, state, dispatch, callbacks) {
    attributes.onMouseOver = event => {
      event.stopPropagation();
      dispatch(hover(this));
    };
    attributes.onMouseOut = event => {
      event.stopPropagation();
      dispatch(unhover(this));
    };

    attributes.onClick = () => callbacks.onClick(this);
    attributes.onAnimationEnd = () => dispatch(stopShaking());

    if (this === state.hoveredElement) {
      attributes.className += ' hovered';
    }

    if (this === state.clickedElement && state.isBadSelection) {
      attributes.className += ' shaking';
    }
  }

  addHistory(attributes, state) {
    if (this === state.statements.top) {
      attributes.className += ' stack-top';
    } else {
      const i = state.statements.indexOf(this);
      if (i >= 0 && i < state.statements.size - 1) {
        attributes.className += ' stack-below';
      }
    }
  }

  evaluatePopup(state, dispatch, callbacks) {
    if (state.mode === Mode.EvaluatingSubexpression && state.activeSubexpression === this) {
      return (
        <div className="evaluate-popup">
          <svg height="12" width="12">
            <polygon points="6,12 0,0 12,0" />
          </svg>
          <input
            id="evaluate-box"
            type="text"
            size="8"
            autoFocus
            autoComplete="off"
            spellCheck="false"
            className={`code ${state.isBadInput ? 'shaking' : ''}`}
            onAnimationEnd={() => dispatch(stopShaking())}
            onChange={e => dispatch(editInput(e.target.value))}
            value={state.currentInput}
            onKeyDown={callbacks.onKeyDown}
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

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    return (
      <div className="block">
        {this.statements.map((statement, i) => <div className="statement" key={`statement-${i}`}>{statement.programify(state, dispatch, callbacks, false, true, indentation)}</div>)}
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

  evaluatorify(state, dispatch, callbacks, isParenthesized) {
    let attributes = {className: 'subexpression'};
    this.addSelectable(attributes, state, dispatch, callbacks);

    const identifierElement = React.createElement('span', attributes, this.id.source);
    return (
      <span className={`subexpression ${state.mode === Mode.EvaluatingSubexpression && state.activeSubexpression === this ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span className="variable-identifier">{identifierElement}</span>
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(state, dispatch, callbacks)}
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

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, state, dispatch, callbacks);
      this.addHistory(attributes, state);
    }

    return React.createElement('span', attributes, 
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span className="expression-piece variable-identifier">{this.id.source}</span>
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );
  }

  promptify(isParenthesized) {
    return (
      <>
        {isParenthesized ? <span>(</span> : ''}
        <span className="variable-identifier">{this.id.source}</span>
        {isParenthesized ? <span>)</span> : ''}
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

  evaluatorify(state, dispatch, callbacks, isParenthesized) {
    let attributes = {className: 'evaluatable unary-prefix-operator expression-piece'};
    this.addSelectable(attributes, state, dispatch, callbacks);

    const operatorElement = React.createElement('span', attributes, this.operator);
    return (
      <span className={`subexpression ${state.mode === Mode.EvaluatingSubexpression && state.activeSubexpression === this ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {operatorElement}
        {this.a.evaluatorify(state, dispatch, callbacks, this.precedence > this.a.precedence)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(state, dispatch, callbacks)}
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

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, state, dispatch, callbacks);
      this.addHistory(attributes, state);
    }

    const element = React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span className="unary-prefix-operator expression-piece">{this.operator}</span>
        {this.a.programify(state, dispatch, callbacks, this.precedence > this.a.precedence, false, '')}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );

    return (
      <>
        <span className="space">{indentation}</span>
        {element}
      </>
    );
  }

  promptify(isParenthesized) {
    return (
      <>
        {isParenthesized ? <span>(</span> : ''}
        <span className="unary-prefix-operator">{this.operator}</span>
        {this.a.promptify(this.precedence > this.a.precedence)}
        {isParenthesized ? <span>)</span> : ''}
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
    this.isLeftAssociative = isLeftAssociative;
  }

  isSimplified() {
    return false;
  }

  evaluatorify(state, dispatch, callbacks, isParenthesized) {
    let attributes = {className: 'evaluatable binary-infix-operator expression-piece'};
    this.addSelectable(attributes, state, dispatch, callbacks);

    const operatorElement = React.createElement('span', attributes, this.operator);
    return (
      <span className={`subexpression ${state.mode === Mode.EvaluatingSubexpression && state.activeSubexpression === this ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.a.evaluatorify(state, dispatch, callbacks, this.isLeftAssociative ? this.precedence > this.a.precedence : this.precedence >= this.a.precedence)}
        <span className="space">{' '}</span>
        {operatorElement}
        <span className="space">{' '}</span>
        {this.b.evaluatorify(state, dispatch, callbacks, this.isLeftAssociative ? this.precedence >= this.b.precedence : this.precedence > this.b.precedence)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(state, dispatch, callbacks)}
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

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, state, dispatch, callbacks);
      this.addHistory(attributes, state);
    }

    const element = React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.a.programify(state, dispatch, callbacks, this.isLeftAssociative ? this.precedence > this.a.precedence : this.precedence >= this.a.precedence, false, '')}
        <span className="space">{' '}</span>
        <span className="binary-infix-operator expression-piece">{this.operator}</span>
        <span className="space">{' '}</span>
        {this.b.programify(state, dispatch, callbacks, this.isLeftAssociative ? this.precedence >= this.b.precedence : this.precedence > this.b.precedence, false, '')}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );

    return (
      <>
        <span className="space">{indentation}</span>
        {element}
      </>
    );
  }

  promptify(isParenthesized) {
    return (
      <>
        {isParenthesized ? <span>(</span> : ''}
        {this.a.promptify(this.isLeftAssociative ? this.precedence > this.a.precedence : this.precedence >= this.a.precedence)}
        <span className="space">{' '}</span>
        <span className="binary-infix-operator">{this.operator}</span>
        <span className="space">{' '}</span>
        {this.b.promptify(this.isLeftAssociative ? this.precedence >= this.b.precedence : this.precedence > this.b.precedence)}
        {isParenthesized ? <span>)</span> : ''}
      </>
    );
  }
}

// --------------------------------------------------------------------------- 

class ExpressionFunctionCall extends Expression {
  constructor(name, operands, where = null) {
    super(Precedence.Atom, where);
    this.name = name;
    this.operands = operands;
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

  evaluatorify(state, dispatch, callbacks, isParenthesized) {
    let attributes = {className: 'evaluatable function-call expression-piece'};
    this.addSelectable(attributes, state, dispatch, callbacks);

    const isActive = (
      state.mode === Mode.PushingFrame ||
      state.mode === Mode.DeclaringVariable ||
      state.mode === Mode.NamingVariable ||
      state.mode === Mode.SelectingMemoryValue ||
      state.mode === Mode.EnteringMemoryValue ||
      state.mode === Mode.SelectingStatement ||
      state.mode === Mode.EvaluatingSubexpression
    ) && state.activeSubexpression === this;

    const callElement = React.createElement('span', attributes, this.name);
    return (
      <span className={`subexpression ${isActive ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span className="function-identifier">{callElement}</span>({
          this.operands.map((operand, i) => (
            <React.Fragment key={`operand-${i}`}>
              {i > 0 ? ', ' : ''}
              {operand.evaluatorify(state, dispatch, callbacks, false)}
            </React.Fragment>
          ))
        })
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(state, dispatch, callbacks)}
      </span>
    )
  }

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, state, dispatch, callbacks);
      this.addHistory(attributes, state);
    }

    const element = React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span className="function-identifier">{this.name}</span>({
          this.operands.map((operand, i) => (
            <React.Fragment key={`operand-${i}`}>
              {i > 0 ? ', ' : ''}
              {operand.programify(state, dispatch, callbacks, false, '')}
            </React.Fragment>
          ))
        })
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );

    return (
      <>
        <span className="space">{indentation}</span>
        {element}
      </>
    );
  }

  promptify(isParenthesized) {
    return (
      <>
        {isParenthesized ? <span>(</span> : ''}
        <span className="function-identifier">{this.name}</span>({
          this.operands.map((operand, i) => (
            <React.Fragment key={`operand-${i}`}>
              {i > 0 ? ', ' : ''}
              {operand.promptify(false)}
            </React.Fragment>
          ))
        })
        {isParenthesized ? <span>)</span> : ''}
      </>
    );
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionUserFunctionCall extends ExpressionFunctionCall {
  constructor(nameToken, actuals, where) {
    super(nameToken.source, actuals, where);
    this.nameToken = nameToken;
  }

  clone() {
    return new this.constructor(this.nameToken, this.operands.map(operand => operand.clone()), this.where);
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new this.constructor(this.nameToken, this.operands.map(operand => operand.simplify(expression, value)));
    }
  }
}

// -------------------------------------------------------------------------- 

class ExpressionBuiltinFunctionCall extends ExpressionFunctionCall {
  clone() {
    return new this.constructor(this.operands.map(operand => operand.clone()), this.where);
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionReturn extends Expression {
  constructor(expression, where = null) {
    super(Precedence.Atom, where);
    this.expression = expression;
  }

  isSimplified() {
    return false;
  }

  get nextNonterminal() {
    return this.expression.nextNonterminal ?? this;
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new this.constructor(this.expression.simplify(expression, value));
    }
  }

  clone() {
    return new this.constructor(this.expression.clone(), this.where);
  }

  evaluatorify(state, dispatch, callbacks, isParenthesized) {
    let attributes = {className: 'evaluatable function-call expression-piece'};
    this.addSelectable(attributes, state, dispatch, callbacks);

    const isActive = (
      state.mode === Mode.EvaluatingSubexpression ||
      state.mode === Mode.SelectingMemoryValue ||
      state.mode === Mode.EnteringMemoryValue
    ) && state.activeSubexpression === this;

    const callElement = React.createElement('span', attributes, 'return');
    return (
      <span className={`subexpression ${isActive ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {callElement} {this.expression.evaluatorify(state, dispatch, callbacks, false)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(state, dispatch, callbacks)}
      </span>
    );
  }

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, state, dispatch, callbacks);
      this.addHistory(attributes, state);
    }

    const element = React.createElement('span', attributes, <>
      {isParenthesized ? <span className="expression-piece">(</span> : ''}
      return {this.expression.programify(state, dispatch, callbacks, false, '')}
      {isParenthesized ? <span className="expression-piece">)</span> : ''}
    </>);

    return (<>
      <span className="space">{indentation}</span>
      {element}
    </>);
  }

  promptify(isParenthesized) {
    return <>
      {isParenthesized ? <span>(</span> : ''}
      return {this.expression.promptify(false)}
      {isParenthesized ? <span>)</span> : ''}
    </>;
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionWhile extends Expression {
  constructor(condition, body, where = null) {
    super(Precedence.Atom, where);
    this.condition = condition;
    this.body = body;
    this.condition.parent = this;
    this.body.parent = this;
  }

  isSimplified() {
    return false;
  }
  
  stepper() {
    return new WhileStepper(this);
  }

  getFirstStatement() {
    return this.condition.getFirstStatement();
  }

  getNextStatement(value, afterChild) {
    if (this.condition === afterChild) {
      return this.body.getFirstStatement();
    } else {
      return super.getNextStatement();
    }
  }

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    return (
      <span>
        <span className="space">{indentation}</span>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        while ({this.condition.programify(state, dispatch, callbacks, false, true, '')})
          {this.body.programify(state, dispatch, callbacks, false, false, indentation + '  ')}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </span>
    );
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionBlankLine extends Expression {
  constructor(where = null) {
    super(Precedence.Atom, where);
  }

  isSimplified() {
    return true;
  }
  
  stepper() {
    return null;
  }

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    return <br/>;
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionWholeLineComment extends Expression {
  constructor(source, where = null) {
    super(Precedence.Atom, where);
    this.source = source;
  }

  isSimplified() {
    return true;
  }
  
  stepper() {
    return null;
  }

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    return <span className="comment">
      <span className="space">{indentation}</span>{this.source}
    </span>;
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionFunctionDefinition extends Expression {
  constructor(identifier, formals, body, where = null) {
    super(Precedence.Atom, where);
    this.identifier = identifier;
    this.formals = formals;
    this.body = body;
    this.body.parent = this;
  }

  isSimplified() {
    return true;
  }

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, state, dispatch, callbacks);
      this.addHistory(attributes, state);
    }

    const element = React.createElement('span', attributes,
      <>
        function <span className="function-identifier">{this.identifier}</span>({this.formals.map((formal, index) =>
          <React.Fragment key={index}>
            <span className="variable-identifier">{formal}</span>
            {index < this.formals.length - 1 && ', '}
          </React.Fragment>
        )})
      </>
    );

    return (
      <span>
        <span className="space">{indentation}</span>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {element}
          {this.body.programify(state, dispatch, callbacks, false, false, indentation + '  ')}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </span>
    );
  }
}

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

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    return (
      <span>
        <span className="space">{indentation}</span>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        if ({this.conditions[0].programify(state, dispatch, callbacks, false, true, '')})
          {this.thenBlocks[0].programify(state, dispatch, callbacks, false, false, indentation + '  ')}
        <span className="space">{indentation}</span>
        else
          {this.elseBlock.programify(state, dispatch, callbacks, false, false, indentation + '  ')}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </span>
    );
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionMax extends ExpressionBuiltinFunctionCall {
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

export class ExpressionMin extends ExpressionBuiltinFunctionCall {
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

export class ExpressionSign extends ExpressionBuiltinFunctionCall {
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

export class ExpressionParseInt extends ExpressionBuiltinFunctionCall {
  constructor(operands, where) {
    super('parseInt', operands, where);
  }

  evaluate(env) {
    const value = this.operands[0].evaluate(env);
    if (value instanceof ExpressionString && value.value.match(/^\d+$/)) {
      return new ExpressionInteger(parseInt(value.value));
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionParseFloat extends ExpressionBuiltinFunctionCall {
  constructor(operands, where) {
    super('parseFloat', operands, where);
  }

  evaluate(env) {
    const value = this.operands[0].evaluate(env);
    if (value instanceof ExpressionString) {
      return new ExpressionReal(parseFloat(value.value));
    } else {
      throw new Error('bad types');
    }
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionReadLine extends ExpressionBuiltinFunctionCall {
  constructor(operands, where) {
    super('readLine', operands, where);
  }

  evaluate(env) {
    return new ExpressionUnit();
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionFormat extends ExpressionBuiltinFunctionCall {
  constructor(operands, where) {
    super('format', operands, where);
  }

  evaluate(env) {
    const subject = this.operands[0].value;

    let parameterIndex = 0;
    const expanded = subject.replace(/%(-\d+|\d*)(d|(\.\d+)?f|s)/g, placeholder => {
      parameterIndex += 1;

      let match = placeholder.match(/%(-\d+|\d*)d/);
      if (match) {
        let isLeftJustified = false;
        let width = 0;
        let padCharacter = ' ';

        if (match[1].startsWith('-')) {
          isLeftJustified = true;
          width = parseInt(match[1].substring(1));
        } else if (match[1].length > 0) {
          if (match[1][0] === '0') {
            padCharacter = '0';
          }
          width = parseInt(match[1]);
        }

        let replacement = this.operands[parameterIndex].value.toString();

        const paddingLength = width - replacement.length;
        if (paddingLength > 0) {
          let padding = ''.padStart(paddingLength, ' ').replace(/ /g, padCharacter);
          replacement = isLeftJustified ? replacement + padding : padding + replacement;
        }

        return replacement;
      } else {
        match = placeholder.match(/%(-\d+|\d*)s/);
        if (match) {
          let isLeftJustified = false;
          let width = 0;

          if (match[1].startsWith('-')) {
            isLeftJustified = true;
            width = parseInt(match[1].substring(1));
          } else if (match[1].length > 0) {
            width = parseInt(match[1]);
          }

          let replacement = this.operands[parameterIndex].value.toString();

          const paddingLength = width - replacement.length;
          if (paddingLength > 0) {
            let padding = ''.padStart(paddingLength, ' ');
            replacement = isLeftJustified ? replacement + padding : padding + replacement;
          }

          return replacement;
        } else {
          let match = placeholder.match(/%(-\d+|\d*)(\.\d+)?f/);
          if (match) {
            let isLeftJustified = false;
            let width = 0;
            let padCharacter = ' ';
            let mantissaWidth = 6;

            if (match[1].startsWith('-')) {
              isLeftJustified = true;
              width = parseInt(match[1].substring(1));
            } else if (match[1].length > 0) {
              if (match[1][0] === '0') {
                padCharacter = '0';
              }
              width = parseInt(match[1]);
            }

            if (match[2].length > 0) {
              mantissaWidth = parseInt(match[2].substring(1));
            }

            let replacement = this.operands[parameterIndex].value.toFixed(mantissaWidth).toString();

            const paddingLength = width - replacement.length;
            if (paddingLength > 0) {
              let padding = ''.padStart(paddingLength, ' ').replace(/ /g, padCharacter);
              replacement = isLeftJustified ? replacement + padding : padding + replacement;
            }
            console.log("replacement:", replacement);

            return replacement;
          }
        }
      }

      throw new Error('bad % code');
    });

    return new ExpressionString(expanded);
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionPrint extends ExpressionBuiltinFunctionCall {
  constructor(operands, where) {
    super('print', operands, where);
  }

  evaluate(env) {
    // TODO what is going on here with output?
    // const values = this.operands.map(operand => operand.evaluate(env).value).join(' ');
    return new ExpressionUnit();
  }

  get output() {
    return this.operands[0].value.toString();
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionPrintLine extends ExpressionBuiltinFunctionCall {
  constructor(operands, where) {
    super('printLine', operands, where);
  }

  evaluate(env) {
    // const values = this.operands.map(operand => operand.evaluate(env).value).join(' ');
    return new ExpressionUnit();
  }

  get output() {
    return this.operands[0].value.toString() + '\n';
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionLValue extends Expression {
  constructor(identifier) {
    super(Precedence.LValue, identifier.where);
    this.identifier = identifier;
  }

  evaluatorify(state, dispatch, callbacks, isParenthesized) {
    let attributes = {className: 'evaluatable expression-piece variable-identifier'};
    this.addSelectable(attributes, state, dispatch, callbacks);

    const element = React.createElement('span', attributes, this.identifier.source);

    return (
      <span className="subexpression">
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {element}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </span>
    );
  }

  promptify(isParenthesized) {
    return (
      <span className="subexpression">
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span className="variable-identifier">{this.identifier.source}</span>
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </span>
    );
  }

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    return (
      <span className="subexpression">
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        <span className="variable-identifier">{this.identifier.source}</span>
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </span>
    );
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionAssignment extends Expression {
  constructor(identifier, rvalue, where) {
    super(Precedence.Assignment, where);
    this.identifier = identifier;
    this.lvalue = new ExpressionLValue(this.identifier);
    this.rvalue = rvalue;
    this.rvalue.parent = this;
  }

  isSimplified() {
    return false;
  }

  evaluatorify(state, dispatch, callbacks, isParenthesized) {
    let attributes = {className: 'evaluatable binary-infix-operator expression-piece'};
    this.addSelectable(attributes, state, dispatch, callbacks);

    const operatorElement = React.createElement('span', attributes, '=');
    const isActive = (
      state.mode === Mode.SelectingMemoryValue ||
      state.mode === Mode.EnteringMemoryValue ||
      state.mode === Mode.DeclaringVariable ||
      state.mode === Mode.EvaluatingSubexpression ||
      state.mode === Mode.NamingVariable
    ) && state.activeSubexpression === this;

    return (
      <span className={`subexpression ${isActive ? 'active' : ''}`}>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.lvalue.evaluatorify(state, dispatch, callbacks, this.precedence > this.lvalue.precedence)}
        <span className="space">{' '}</span>
        {operatorElement}
        <span className="space">{' '}</span>
        {this.rvalue.evaluatorify(state, dispatch, callbacks, this.precedence > this.rvalue.precedence)}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
        {this.evaluatePopup(state, dispatch, callbacks)}
      </span>
    );
  }

  get nextNonterminal() {
    let node = this.rvalue.nextNonterminal;
    if (!node) {
      node = this;
    }
    return node;
  }

  simplify(expression, value) {
    if (this === expression) {
      return value;
    } else {
      return new this.constructor(this.identifier, this.rvalue.simplify(expression, value));
    }
  }

  clone() {
    return new this.constructor(this.identifier, this.rvalue.clone(), this.where);
  }

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression'};
    if (isSelectable) {
      this.addSelectable(attributes, state, dispatch, callbacks);
      this.addHistory(attributes, state);
    }

    const element = React.createElement('span', attributes,
      <>
        {isParenthesized ? <span className="expression-piece">(</span> : ''}
        {this.lvalue.programify(state, dispatch, callbacks, false, false, '')}
        <span className="space">{' '}</span>
        <span className="binary-infix-operator expression-piece">=</span>
        <span className="space">{' '}</span>
        {this.rvalue.programify(state, dispatch, callbacks, this.precedence > this.rvalue.precedence, false, '')}
        {isParenthesized ? <span className="expression-piece">)</span> : ''}
      </>
    );

    return (
      <>
        <span className="space">{indentation}</span>
        {element}
      </>
    );
  }

  promptify(isParenthesized) {
    return <>
        {isParenthesized ? <span>(</span> : ''}
        {this.lvalue.promptify(false)}
        <span className="space">{' '}</span>
        <span className="binary-infix-operator">=</span>
        <span className="space">{' '}</span>
        {this.rvalue.promptify(false)}
        {isParenthesized ? <span>)</span> : ''}
    </>;
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

export class ExpressionSubtract extends ExpressionBinaryOperator {
  constructor(a, b, where) {
    super(Precedence.Additive, '-', true, a, b, where);
  }

  evaluate(env) {
    const valueA = this.a.evaluate(env);
    const valueB = this.b.evaluate(env);

    if (valueA instanceof ExpressionInteger && valueB instanceof ExpressionInteger) {
      return new ExpressionInteger(valueA.value - valueB.value);
    } else if ((valueA instanceof ExpressionReal || valueA instanceof ExpressionInteger) &&
               (valueB instanceof ExpressionReal || valueB instanceof ExpressionInteger)) {
      return new ExpressionReal(valueA.value - valueB.value);
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

  toString() {
    return this.value.toString();
  }

  isSimplified() {
    return true;
  }

  equals(that) {
    return that && this.constructor === that.constructor && this.value === that.value;
  }

  evaluatorify(state, dispatch, callbacks, isParenthesized) {
    let attributes = {className: 'evaluatable subexpression expression-piece literal'};
    this.addSelectable(attributes, state, dispatch, callbacks);

    return React.createElement('span', attributes, this.toString());
  }

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    let attributes = {className: 'subexpression expression-piece literal'};
    if (isSelectable) {
      this.addSelectable(attributes, state, dispatch, callbacks);
      this.addHistory(attributes, state);
    }

    const element = React.createElement('span', attributes, this.toString());
    return (
      <>
        <span className="space">{indentation}</span>
        {element}
      </>
    );
  }

  promptify(isParenthesized) {
    return <>
      {isParenthesized ? <span>(</span> : ''}
      <span className="literal">{this.toString()}</span>
      {isParenthesized ? <span>)</span> : ''}
    </>;
  }
}

export class ExpressionInteger extends ExpressionLiteral {
}

export class ExpressionReal extends ExpressionLiteral {
}

export class ExpressionString extends ExpressionLiteral {
  toString() {
    // TODO escape
    return `"${this.value.toString()}"`;
  }
}

export class ExpressionCharacter extends ExpressionLiteral {
  toString() {
    // TODO escape
    return `'${this.value.toString()}'`;
  }
}

export class ExpressionAddress extends ExpressionLiteral {
  toString() {
    return `x${this.value.toString()}`;
  }
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
    return that && this.constructor === that.constructor;
  }

  evaluatorify(state, dispatch, callbacks, isParenthesized) {
    return null;
  }

  programify(state, dispatch, callbacks, isParenthesized, isSelectable, indentation) {
    return null;
  }

  promptify(isParenthesized) {
    return 'void';
  }
}

// --------------------------------------------------------------------------- 

export class ExpressionUndefined extends Expression {
  constructor(where) {
    super(Precedence.Atom, where);
  }

  clone() {
    return new this.constructor(this.where);
  }

  toString() {
    return 'undefined';
  }

  evaluate(env) {
    return this;
  }

  isSimplified() {
    return true;
  }

  equals(that) {
    return that && this.constructor === that.constructor;
  }
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
  } else if (expression.match(/^void$/)) {
    return new ExpressionUnit();
  } else if (expression.match(/^'.'$/)) {
    return new ExpressionCharacter(expression.slice(1, -1));
  } else if (expression.match(/^".*"$/)) {
    return new ExpressionString(expression.slice(1, -1));
  } else if (expression.match(/^x[0-9A-Fa-f]+$/)) {
    return new ExpressionAddress(expression.slice(1));
  } else {
    return null;
  }
}

// --------------------------------------------------------------------------- 

