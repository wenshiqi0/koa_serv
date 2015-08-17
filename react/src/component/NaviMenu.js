/**
 * Created by Administrator on 2015/8/11.
 */
var React = require('react');
var mui = require('material-ui');
var ThemeManager = mui.Styles.ThemeManager();
var Menu = require('material-ui/lib/menus/menu');
var MenuItem = require('material-ui/lib/menus/menu-item');

var NaviMenu = React.createClass({
    render:function(){
        return (
            <Menu desktop={true} width={this.props.width} maxHeight={this.props.maxHeight}>
                <MenuItem primaryText='item1' />
                <MenuItem primaryText='item2' />
                <MenuItem primaryText='item3' />
                <MenuItem primaryText='item4' />
            </Menu>
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