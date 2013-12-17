"use strict";var PrototypeExtensions={data:function(e,t,n){var r,i,s,o,u;r=/data-(\w+)/;i=0;s=e.attributes.length;if(t&&n)e.setAttribute("data-"+t,n);else for(;i<s;++i){o=e.attributes[i];if(o&&o.name){var a=o.name.match(r);if(a&&a.length>1){u=a[1];if(u===t)return o.value}}}}};Element.addMethods(PrototypeExtensions);var sort_by=function(e,t,n){var r=n?function(t){return n(t[e])}:function(t){return t[e]};t=[-1,1][+!!t];return function(e,n){return e=r(e),n=r(n),t*((e>n)-(n>e))}},dudusLibrary=new localStorageDB("dudus",localStorage);if(dudusLibrary.isNew()){dudusLibrary.createTable("todos",["text","note","favorite","active","folder","date","weight","created","reminder"]);dudusLibrary.commit()}var dudu,DuduLists=Class.create({initialize:function(e){this.callback=[];this.formField=e;this.activeDudus=dudusLibrary.query("todos",{active:"1"});this.inactiveDudus=dudusLibrary.query("todos",{active:"0"});this.activeDudusUL=$("activeDudusUL");this.inactiveDudusUL=$("inactiveDudusUL");this.refreshLists(this.activeDudus,this.activeDudusUL);this.refreshLists(this.inactiveDudus,this.inactiveDudusUL);this.updateCompletedItemsHeader();this.fieldObserver(this.formField);this.rubberNeck()},fieldObserver:function(e){e.observe("keypress",function(e){if(e.keyCode==Event.KEY_RETURN||e.which==Event.KEY_RETURN){this.createDudu();Event.stop(e)}}.bind(this))},favoriteObserver:function(){$("activeDudusWrapper","editForm").invoke("on","click",".favoriteToggle",function(e,t){var n,r,i,s,o,u;s=t.up();n=s.hasClassName("duduEdit")?s.data("id"):s.getAttribute("id");if(s.hasClassName("duduEdit")){i=!0;o=$(n);r=o.up()}else{i=!1;r=s.up()}if(s.hasClassName("unflagged")){u="1";s.removeClassName("unflagged").addClassName("flagged");t.removeClassName("glyphicon-star-empty").addClassName("glyphicon-star");if(i){$(n).removeClassName("unflagged").addClassName("flagged");$(n).down(".glyphicon").removeClassName("glyphicon-star-empty").addClassName("glyphicon-star")}}else{u="0";s.removeClassName("flagged").addClassName("unflagged");t.removeClassName("glyphicon-star").addClassName("glyphicon-star-empty")}if(n){dudusLibrary.update("todos",{ID:n},function(e){e.favorite=u;return e});dudusLibrary.commit()}})},doneObserver:function(){$("duduContainer").on("click",".done",function(e,t){var n,r,i,s,o;s=t.up();n=s.hasClassName("duduEdit")?s.data("id"):s.getAttribute("id");if(s.hasClassName("duduEdit")){i=!0;o=$(n);r=o.up()}else{i=!1;$("editForm").visible()&&(o=n==$(n+"_editing").data("id")?$(n+"_editing"):!1);r=s.up()}if(t.checked==1){s.removeClassName("active").addClassName("inactive");if(i){s.removeClassName("active").addClassName("inactive");o.down(".done").checked=!0;t.next("span",1).addClassName("disabled")}else if(o){o.removeClassName("active").addClassName("inactive");o.down(".done").checked=!0}inactiveDudusUL.insert({top:r});dudusLibrary.update("todos",{ID:n},function(e){e.active="0";return e})}else{s.addClassName("active").removeClassName("inactive");if(i){$(n+"_editing").removeClassName("inactive").addClassName("active");r.down(".done").checked=!1;t.next("span",1).removeClassName("disabled")}else if(o){o.addClassName("active").removeClassName("inactive");o.down(".done").checked=!1}activeDudusUL.insert({bottom:r});dudusLibrary.update("todos",{ID:n},function(e){e.active="1";return e})}dudusLibrary.commit();this.updateCompletedItemsHeader()}.bind(this))},updateCompletedItemsHeader:function(){var e=$$("#inactiveDudusUL li").length,t=e>1?"s":"";e>0?$("completedDudus").update(e+" Completed Item"+t):$("completedDudus").update("")},createDudu:function(){var e,t,n,r,i;e=this.formField.getValue();t=$("favoriteToggle").data("favorite");i=this.formField.up().hasClassName("unflagged")?"unflagged":"flagged";n=t==0?"-empty":"";r=dudusLibrary.insert("todos",{text:e,note:"",favorite:t,active:"1",folder:"default",date:"",weight:"0",created:Date.now(),reminder:""});dudusLibrary.commit();activeDudusUL.insert({top:'<li data-id="'+r+'" class="active list-group-item"><div id="'+r+'" class="duduItem active '+i+'"><input class="done" type="checkbox" value="1">'+e+'<span class="glyphicon glyphicon-star'+n+' pull-right star favoriteToggle" data-favorite="'+t+'"></span></div></li>'});this.formField.clear()},deleteDudu:function(e,t){Modalbox.show($("confirmDelete"),{title:"Really delete "+t+"?",width:400,slideDownDuration:.1,slideUpDuration:.2,afterLoad:function(t){$("deleteDudu").observe("click",function(t){dudusLibrary.deleteRows("todos",{ID:e});dudusLibrary.commit();Modalbox.hide();$("collapseMe").removeClassName("col-md-4").addClassName("col-md-9");$("editForm").hide();$("editing").remove()})}})},refreshLists:function(e,t){if(e){var n,r,i,s,o,u;n=e.sort(sort_by("weight",!1,parseInt));n.each(function(e){r=e.favorite==0?"-empty":"";u=e.favorite==0?"unflagged":"flagged";i=e.active==0?"checked":"";s=e.active==0?"inactive ":"active ";o=typeof e.note=="undefined"?"":'<span class="glyphicon glyphicon-pencil"></span>';t.insert({top:'<li data-ID="'+e.ID+'" class="'+s+'list-group-item"><div id="'+e.ID+'" class="duduItem '+u+" "+s+'"><input class="done" type="checkbox" value="1" '+i+">"+e.text+o+'<span class="glyphicon glyphicon-star'+r+' pull-right duduItem star favoriteToggle" data-favorite="'+e.favorite+'"></span></div></li>'})})}},rubberNeck:function(){this.favoriteObserver();this.doneObserver();this.editObserver()},editObserver:function(){$("duduContainer").on("dblclick","li",function(e,t){var n,r,i,s;t.setAttribute("id","editing");if($("collapseMe").hasClassName("col-md-9")){$("collapseMe").removeClassName("col-md-9").addClassName("col-md-4");$("editForm").show();n=t.data("id");r=dudusLibrary.query("todos",{ID:n});r=r[0];this.populateEditForm(r);$("closeForm").observe("click",function(){t.removeAttribute("id");$("collapseMe").removeClassName("col-md-4").addClassName("col-md-9");$("editForm").hide()})}}.bind(this))},populateEditForm:function(e){var t,n,r,i,s,o;t=e.favorite==0?"-empty":"";n=e.active==0?"checked":"";r=e.active==0?"inactive ":"active ";i=e.ID;s=new Template('<div class="'+r+'panel panel-default"><div class="panel-heading"><h3 class="panel-title""><div data-id="#{ID}" id="'+i+'_editing" class="duduEdit duduItem '+r+'"><input class="done" type="checkbox" value="1" '+n+'>&nbsp;&nbsp;<span class="editable" data-attribute="text, #{ID}">#{text}</span><span class="glyphicon glyphicon-star'+t+' pull-right duduItem star favoriteToggle" data-favorite="'+e.favorite+'"></span></div></h3></div><ul class="list-group"><li class="list-group-item"><h6>Note:</h6><div class="well well-sm editable" data-type="textarea" data-attribute="note, #{ID}">#{note}</div></li></ul><div class="panel-footer text-center"><span class="glyphicon glyphicon-trash pull-left"></span><small>Created '+moment(e.created).format("ddd, MMMM Do")+'</small> <span id="closeForm" class="glyphicon glyphicon-expand pull-right"></span></div></div>');o=s.evaluate(e);$("editForm").update(o);$j(".editable").jinplace({placeholder:"Click to edit",submitFunction:function(e,t){var n,r,i;n=e.attribute.split(",");r=parseInt(n[1]);i=n[0];dudusLibrary.update("todos",{ID:r},function(e){switch(i){case"text":e.text=t;break;case"note":e.note=t}return e});dudusLibrary.commit();return t}});$("editForm").down(".glyphicon-trash").observe("click",function(t){this.deleteDudu(i,e.text)}.bind(this))}});Event.observe(window,"load",function(){dudu=new DuduLists($("duduItem"))}.bind(window));