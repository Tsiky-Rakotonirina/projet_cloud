System.register(["./index-legacy-mk7QmLit.js"],function(t,e){"use strict";var n,r,i;return{setters:[function(t){n=t.ai,r=t.aj,i=t.ak}],execute:function(){
/*!
             * (C) Ionic http://ionicframework.com - MIT License
             */
t("createSwipeBackGesture",function(t,e,a,u,o){var c=t.ownerDocument.defaultView,s=n(t),f=function(t){return s?-t.deltaX:t.deltaX};return r({el:t,gestureName:"goback-swipe",gesturePriority:101,threshold:10,canStart:function(r){return s=n(t),function(t){var e=t.startX;return s?e>=c.innerWidth-50:e<=50}(r)&&e()},onStart:a,onMove:function(t){var e=f(t)/c.innerWidth;u(e)},onEnd:function(t){var e=f(t),n=c.innerWidth,r=e/n,a=function(t){return s?-t.velocityX:t.velocityX}(t),u=a>=0&&(a>.2||e>n/2),d=(u?1-r:r)*n,v=0;if(d>5){var l=d/Math.abs(a);v=Math.min(l,540)}o(u,r<=0?.01:i(0,r,.9999),v)}})})}}});
