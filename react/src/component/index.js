var React = require('react');
var NaviBar = require('./NaviBar');
var ListView = require('./ListView');
var NaviMenu = require('./NaviMenu');

var Index = React.createClass({
    render: function() {
        return (
            <div>
                <NaviBar />
                <ListView />
            </div>
        );
    }
});

module.exports = Index;