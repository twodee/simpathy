import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  editInput,
  enterRightMemoryValue,
  enterWrongMemoryValue,
  hover,
  selectRightMemoryValue,
  selectWrongMemoryValue,
  stopShaking,
  unhover,
} from '../actions';

import {
  Mode,
} from '../constants';

import {
  parseLiteral,
} from '../ast';

const StackFrame = props => {
  const dispatch = useDispatch();

  const activeSubexpression = useSelector(state => state.activeSubexpression);
  const frames = useSelector(state => state.frames);
  const hoveredElement = useSelector(state => state.hoveredElement);
  const clickedElement = useSelector(state => state.clickedElement);
  const isBadSelection = useSelector(state => state.isBadSelection);
  const isBadInput = useSelector(state => state.isBadInput);
  const mode = useSelector(state => state.mode);
  const currentInput = useSelector(state => state.currentInput);

  const frame = frames[props.index];

  return (
    <div className="stack-frame">
      <div className="code cell function-name-cell cell-in-row-0">{frame.name}</div>
      {
        frame.variables.map((variable, i) => {
          let element;
          if (mode === Mode.EnteringMemoryValue && props.index === 0 && activeSubexpression.identifier.source === variable.name) {
            element = <input
              type="text"
              autoFocus
              autoComplete="off"
              spellCheck="false"
              className={`code memory-value-input ${isBadInput ? 'shaking' : ''}`}
              value={currentInput}
              onAnimationEnd={() => dispatch(stopShaking())}
              onChange={e => dispatch(editInput(e.target.value))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const expected = activeSubexpression.value;
                  const actual = parseLiteral(currentInput);
                  if (expected.equals(actual)) {
                    dispatch(enterRightMemoryValue());
                  } else {
                    dispatch(enterWrongMemoryValue());
                  }
                }
              }}
              />
          } else {
            let attributes = {className: 'evaluatable'};

            attributes.onMouseOver = event => dispatch(hover(event, variable));
            attributes.onMouseOut = event => dispatch(unhover(event, variable));
            attributes.onClick = () => {
              if (mode === Mode.SelectingMemoryValue && props.index === 0 && activeSubexpression.identifier.source === variable.name) {
                dispatch(selectRightMemoryValue(variable));
              } else {
                dispatch(selectWrongMemoryValue(variable));
              }
            };
            attributes.onAnimationEnd = () => dispatch(stopShaking());

            if (variable === hoveredElement) {
              attributes.className += ' hovered';
            }

            if (variable === clickedElement && isBadSelection) {
              attributes.className += ' shaking';
            }

            element = React.createElement('span', attributes, variable.current.value.toString());
          }

          return (
            <React.Fragment key={variable.name}>
              <div className="code cell variable-name-cell">{variable.name}</div>
              <div className={`cell arrow-cell`}>&rarr;</div>
              <div className="code cell variable-value-cell">{element}</div>
              <div className="code cell variable-history-cell">{variable.history.map((old, i) => <span key={`value-${variable.history.length - 1 - i}`} className="old">{old.value}</span>)}</div>
              {i === 0 && <div className={`cell close-cell`}>&#x2716;</div>}
            </React.Fragment>
          );
        })
      }
    </div>
  );
};

export default StackFrame;
