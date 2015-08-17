var React = require('react');
var NaviBar = require('./NaviBar');
var ListView = require('./ListView');
var NaviMenu = require('./NaviMenu');

var Index = React.createClass({displayName: "Index",
    render: function() {
        return (
            React.createElement("div", null, 
                React.createElement(NaviBar, null), 
                React.createElement(ListView, null)
            )
        );
    }
});

module.exports = Index;