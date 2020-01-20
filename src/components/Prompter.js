import React from 'react';
import { connect } from 'react-redux';

class Prompter extends React.Component {
  render() {
    return (
      <div id="prompter"><div id="message">{this.props.message}</div></div>
    );
  }
}

const mapStateToProps = state => {
  return {
    message: state.message,
  };
};

const mapDispatchToProps = dispatch => {
  return {
  };
};

Prompter = connect(mapStateToProps, mapDispatchToProps)(Prompter);

export default Prompter;
