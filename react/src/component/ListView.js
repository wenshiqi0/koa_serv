/**
 * Created by Administrator on 2015/8/11.
 */
var React = require('react');
var mui = require('material-ui');
var ThemeManager = new mui.Styles.ThemeManager();
var List = mui.List;
var ListItem = mui.ListItem;

var ListView = React.createClass({
    render:function(){
        return (
            <List>
                <ListItem primaryText="test1" />
                <ListItem primaryText="test2" />
                <ListItem primaryText="test3" />
                <ListItem primaryText="test4" />
                <ListItem primaryText="test5" />
            </List>
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
