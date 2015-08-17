/**
 * Created by Winsky on 15/8/5.
 */
(function(){
    var React = require('react/addons')
    var Index = require('./component/index.js')
    var injectTapEventPlugin = require("react-tap-event-plugin");
    window.React = React;
    injectTapEventPlugin();
    React.render(<Index /> , document.body)
})()