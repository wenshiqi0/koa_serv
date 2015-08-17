/**
 * Created by Administrator on 2015/8/11.
 */
var React = require('react');
var mui = require('material-ui');
var ThemeManager = new mui.Styles.ThemeManager();
var AppBar = require('material-ui/lib/app-bar');
var NaviMenu = require('./NaviMenu');
var merge = require('merge');

var NaviBar = React.createClass({displayName: "NaviBar",

    render:function(){
        var child = [];
        if(this.state.menuEnable){
            child.push(
                React.createElement("div", {ref: "menu", style: {position: 'absolute',top:'40px',left:'135px'}}, 
                    React.createElement(NaviMenu, {width: 200})
                )
            )
        }
        return (
            React.createElement("div", {onMouseLeave: this.handleMouseLeave}, 
                React.createElement(AppBar, {ref: "appBar", onLeftIconButtonTouchTap: this.handleLeftTap, title: "Title"}, 
                    child
                )
            )
        )
    },
    handleLeftTap:function(e){
        this.setState({menuEnable:true});
    },
    handleMouseLeave:function(){
        this.setState({menuEnable:false});
    },
    getInitialState:function(){
        return {
            menuEnable:false
        }
    },
    childContextTypes:{
        muiTheme:React.PropTypes.object,
    },
    getChildContext:function(){
        return{
            muiTheme:ThemeManager.getCurrentTheme()
        }
    },
})


module.exports = NaviBar;
