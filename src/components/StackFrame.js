import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  editInput,
  enterRightMemoryValue,
  enterWrongMemoryValue,
  enterRightVariableName,
  enterWrongVariableName,
  hover,
  selectRightMemoryValue,
  selectWrongMemoryValue,
  stopShaking,
  unhover,
  declareRightly,
  declareWrongly,
  popFrameRightly,
  popFrameWrongly,
} from '../actions';

import {
  Mode,
} from '../constants';

import {
  parseLiteral,
} from '../ast';

const StackFrame = props => {
  const dispatch = useDispatch();

  // const activeSubexpression = useSelector(state => state.activeSubexpression);
  const stack = useSelector(state => state.memory.stack);
  const hoveredElement = useSelector(state => state.hoveredElement);
  const clickedElement = useSelector(state => state.clickedElement);
  const isBadSelection = useSelector(state => state.isBadSelection);
  const isBadInput = useSelector(state => state.isBadInput);
  const mode = useSelector(state => state.mode);
  const currentInput = useSelector(state => state.currentInput);
  const expectedName = useSelector(state => state.expectedName);
  const expectedValue = useSelector(state => state.expectedValue);
  const isBadDeclare = useSelector(state => state.isBadDeclare);
  const isBadPopFrame = useSelector(state => state.isBadPopFrame);
  const activeFrameIndex = useSelector(state => state.activeFrameIndex);

  const isTopFrame = props.index === stack.length - 1;
  const frame = stack[props.index];

  const onExpandEllipse = event => {
    const element = event.target;
    if (element.offsetWidth < element.scrollWidth) {
      element.classList.add('expanded');
      const tooltip = event.target.children[0];
      const bounds = element.getBoundingClientRect();
      tooltip.style.left = bounds.left + 'px';
      tooltip.style.top = (bounds.top - 0) + 'px';
    }
  };

  const onContractEllipse = event => {
    const element = event.target;
    element.classList.remove('expanded');
  };

  const onContractParentEllipse = event => {
    const element = event.target;
    element.parentNode.classList.remove('expanded');
  };

  let declareAttributes = {
    className: (isBadDeclare && activeFrameIndex === props.index) ? 'shaking' : '',
    onClick: () => {
      if (mode === Mode.Declaring) {
        if (isTopFrame) {
          dispatch(declareRightly());
        } else {
          dispatch(declareWrongly(<>No, that stack frame isn't active right right now.</>, props.index));
        }
      } else {
        dispatch(declareWrongly(<>No, we don't need a new declaration right now.</>, props.index));
      }
    },
    onAnimationEnd: () => dispatch(stopShaking()),
  };
  const declareButton = React.createElement('button', declareAttributes, 'declare');

  let popFrameAttributes = {
    className: (isBadPopFrame && activeFrameIndex === props.index) ? 'shaking' : '',
    onClick: () => {
      if (mode === Mode.PoppingFrame) {
        if (isTopFrame) {
          dispatch(popFrameRightly());
        } else {
          dispatch(popFrameWrongly(<>No, that stack frame isn't active right right now.</>, props.index));
        }
      } else {
        dispatch(popFrameWrongly(<>No, we don't want to pop a stack frame right now.</>, props.index));
      }
    },
    onAnimationEnd: () => dispatch(stopShaking()),
  };
  const popFrameButton = React.createElement('button', popFrameAttributes, 'pop');

  return (
    <>
      <div className="stack-frame">
        <div className="code cell function-name-cell ellipsize" onMouseOver={onExpandEllipse} onMouseLeave={onContractEllipse}>
          {frame.name}
          <div className="expanded-tooltip" onMouseLeave={onContractParentEllipse}>{frame.name}</div>
          <div className="panel-actions">
            {declareButton} &middot; {popFrameButton}
          </div>
        </div>
        {
          frame.variables.map((variable, i) => {
            let element;
            if (isTopFrame && mode === Mode.EnteringMemoryValue && expectedName === variable.name) {
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
                    const actualValue = parseLiteral(currentInput);
                    if (!actualValue) {
                      dispatch(enterWrongMemoryValue(<>No, <code className="code prompt-code">{currentInput}</code> is not a legal primitive.</>));
                    } else if (expectedValue.equals(actualValue)) {
                      dispatch(enterRightMemoryValue());
                    } else if (expectedValue.constructor !== actualValue.constructor) {
                      dispatch(enterWrongMemoryValue(<>No, <code className="code prompt-code">{currentInput}</code> is not of the right type.</>));
                    } else {
                      dispatch(enterWrongMemoryValue(<>No, <code className="code prompt-code">{currentInput}</code> is not the right value.</>));
                    }
                  }
                }}
                />
            } else {
              let attributes = {className: 'evaluatable'};

              attributes.onMouseOver = event => dispatch(hover(variable));
              attributes.onMouseOut = event => dispatch(unhover(variable));
              attributes.onClick = () => {
                if (isTopFrame && mode === Mode.SelectingMemoryValue && expectedName === variable.name) {
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

              element = React.createElement('span', attributes, variable.current.toString());
            }

            let nameElement;
            if (mode === Mode.Naming && variable.name === '') {
              let nameAttributes = {
                className: `variable-name-input ${isBadInput ? 'shaking' : ''}`,
                value: currentInput,
                autoFocus: true,
                onAnimationEnd: () => dispatch(stopShaking()),
                onChange: e => dispatch(editInput(e.target.value)),
                onKeyDown: e => {
                  if (e.key === 'Enter') {
                    const actualName = currentInput;
                    if (expectedName === actualName) {
                      dispatch(enterRightVariableName());
                    } else {
                      dispatch(enterWrongVariableName(actualName));
                    }
                  }
                },
              };
              nameElement = React.createElement('input', nameAttributes);
            } else {
              nameElement = variable.name;
            }

            return (
              <React.Fragment key={variable.name}>
                <div className="code cell variable-name-cell ellipsize" onMouseOver={onExpandEllipse} onMouseLeave={onContractEllipse}>
                  {nameElement}
                  <div className="expanded-tooltip" onMouseLeave={onContractParentEllipse}>{variable.name}</div>
                </div>
                <div className={`cell arrow-cell`}>&rarr;</div>
                <div className="code cell variable-value-cell">{element}</div>
                <div className="code cell variable-history-cell">{variable.history.map((old, i) => <span key={`value-${variable.history.length - 1 - i}`} className="old">{old.value}</span>)}</div>
              </React.Fragment>
            );
          })
        }

      </div>
    </>
  );
};

export default StackFrame;
