$(function(){!function(){$("body").on("submit",'[data-form="subscribe"]',function(s){console.log("[WGST] Submitting subscribe form..."),s.preventDefault();var e=$('[data-form="subscribe"]'),o=e.find('[data-input="email"]').val();if("undefined"==typeof o||""===o)return console.error("[WGST][Validation][Error] ✗ No email"),void 0;var i=$(this).find('[type="submit"]');i.prop("disabled",!0),i.find("span").addClass("wgst--hide-this"),i.find(".wgst-spinner").removeClass("wgst--hide-this");var r={email:o};console.dir(r),$.ajax({type:"POST",url:"/subscribe/",datatype:"json",data:r}).done(function(){console.log("[WGST] Subscribed"),i.addClass("wgst--hide-this"),$(".wgst-subscribe-success-message").removeClass("wgst--hide-this")}).fail(function(s,e,o){console.log("[WGST][Error] Failed to subscribe"),console.error(e),console.error(o),console.error(s)})})}()});