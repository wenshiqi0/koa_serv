/**
 * Created by Administrator on 2015/8/11.
 */
var React = require('react');
var mui = require('material-ui');
var ThemeManager = mui.Styles.ThemeManager();
var Menu = require('material-ui/lib/menus/menu');
var MenuItem = require('material-ui/lib/menus/menu-item');

var NaviMenu = React.createClass({displayName: "NaviMenu",
    render:function(){
        return (
            React.createElement(Menu, {desktop: true, width: this.props.width, maxHeight: this.props.maxHeight}, 
                React.createElement(MenuItem, {primaryText: "item1"}), 
                React.createElement(MenuItem, {primaryText: "item2"}), 
                React.createElement(MenuItem, {primaryText: "item3"}), 
                React.createElement(MenuItem, {primaryText: "item4"})
            )
        )
    },
    getChildContext:function(){
        return {
            muiTheme:ThemeManager.getCurrentTheme()
        }
    },
    childContextTypes:{
        muiTheme:React.PropTypes.object,
    },
})

module.exports = NaviMenu;