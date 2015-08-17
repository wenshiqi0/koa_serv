/**
 * Created by Administrator on 2015/8/11.
 */
var React = require('react');
var mui = require('material-ui');
var ThemeManager = new mui.Styles.ThemeManager();
var List = mui.List;
var ListItem = mui.ListItem;

var ListView = React.createClass({displayName: "ListView",
    render:function(){
        return (
            React.createElement(List, null, 
                React.createElement(ListItem, {primaryText: "test1"}), 
                React.createElement(ListItem, {primaryText: "test2"}), 
                React.createElement(ListItem, {primaryText: "test3"}), 
                React.createElement(ListItem, {primaryText: "test4"}), 
                React.createElement(ListItem, {primaryText: "test5"})
            )
        )
    },
    childContextTypes:{
        muiTheme:React.PropTypes.object,
    },
    getChildContext:function(){
        return{
            muiTheme:ThemeManager.getCurrentTheme()
        }
    }
})

module.exports = ListView;
