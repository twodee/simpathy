import React from 'react';
import { connect } from 'react-redux';

class StackFrame extends React.Component {
  render() {
    return (
      <React.Fragment>
        <div className={`function-name-cell ${!this.props.isFirst ? 'bordered-cell' : ''}`}>
          { this.props.name }
        </div>
        {
          this.props.variables.map((variable, i) => (
            <React.Fragment key={variable.name}>
              <div className={`variable-name-cell ${i === 0 && !this.props.isFirst ? 'bordered-cell' : ''}`}>{ variable.name }</div>
              <div className={`variable-value-cell ${i === 0 && !this.props.isFirst ? 'bordered-cell' : ''}`}>{ variable.current }</div>
            </React.Fragment>
          ))
        }
      </React.Fragment>
    );
  }
}

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
