$(function(){!function(){$("body").on("change",".wgst-dropped-assembly-list",function(){var o=$(this).val();window.WGST.exports.showAssemblyUpload(o)}),$("body").on("click",".wgst-dropped-assembly-list-navigation-button__previous",function(){window.WGST.exports.showPreviousAssemblyUpload()}),$("body").on("click",".wgst-dropped-assembly-list-navigation-button__next",function(){window.WGST.exports.showNextAssemblyUpload()}),window.WGST.exports.showPreviousAssemblyUpload=function(){var o=$(".wgst-dropped-assembly-list option:selected").prev();o.length&&o.prop("selected","selected").change()},window.WGST.exports.showNextAssemblyUpload=function(){var o=$(".wgst-dropped-assembly-list option:selected").next();o.length&&o.prop("selected","selected").change()},window.WGST.exports.showAssemblyUpload=function(o){return"undefined"==typeof o?!1:(console.log("assemblyFileId: "+o),window.WGST.exports.showAssemblyUploadAnalytics(o),window.WGST.exports.showAssemblyUploadMetadata(o),void 0)}}()});