import React from 'react';
import { connect } from 'react-redux';

class StackFrame extends React.Component {
  render() {
    return (
      <div className="stack-frame">
        <div className="code cell function-name-cell cell-in-row-0">{this.props.name}</div>
        {
          this.props.variables.map((variable, i) => (
            <React.Fragment key={variable.name}>
              <div className={`code cell variable-name-cell ${i == this.props.variables.length - 1 && i > 0 ? 'bottom-left-cell' : ''}`}>{variable.name}</div>
              <div className={`cell arrow-cell cell-in-row-${i}`}>&rarr;</div>
              <div className={`code cell variable-value-cell`}>{variable.current}</div>
              <div className={`code cell variable-history-cell ${i == 0 ? 'top-right-cell' : ''} ${i == this.props.variables.length - 1 ? 'bottom-right-cell' : ''}`}>{variable.history.map(old => <span className="old">{old}</span>)}</div>
            </React.Fragment>
          ))
        }
      </div>
    );
  }
}
              // <div className={`code cell variable-history-cell ${i == 0 ? 'top-right-cell' : ''} ${i == this.props.variables.length - 1 ? 'bottom-right-cell' : ''}`}>asdf asd fasd fasd fasd fasdf asdkfa sdf asdlkf sadf asd kfasd fasd fasdl kfasld fasd lfas ldfa lsdfa sdfal sdfals dfas ldfa lsdfa sdlf asdf asdf asdf asd fasd fasdkl faslkdjf asd</div>

const mapStateToProps = state => {
  return {
    foo: 'bopper',
  };
};

const mapDispatchToProps = dispatch => {
  return {
  };
};

StackFrame = connect(mapStateToProps, mapDispatchToProps)(StackFrame);

export default StackFrame;
