require(["esri/Map","esri/views/MapView","esri/layers/FeatureLayer","esri/layers/GraphicsLayer","esri/Graphic","esri/renderers/SimpleRenderer","esri/symbols/SimpleMarkerSymbol","esri/symbols/SimpleFillSymbol","esri/renderers/UniqueValueRenderer","bootstrap/Dropdown","bootstrap/Collapse","calcite-maps/calcitemaps-v0.3","dojo/domReady!"],function(e,t,n,r,o,l,a,s,c){function d(e){E.removeAll();var t=e.results[0].graphic,n=t.attributes;console.log(n);var r=(n.Primary_Building_Name,new o({geometry:e.results[0].graphic.geometry,symbol:new s({color:[255,0,0,.6],style:"solid",outline:{color:"red",width:2}})}));E.add(r);var i=[],l=[],a=n;for(var c in a)a.hasOwnProperty(c)&&"object"!=typeof a[c]&&("BottleFiller"!=c&&"CommonRoom"!=c&&"ComputerRoom"!=c&&"Elevator"!=c&&"GameTable"!=c&&"Kitchen"!=c&&"Laundry"!=c&&"MusicPracticeRoom"!=c&&"Printer"!=c&&"Special"!=c&&"StudyRoom"!=c&&"RecyclingCompostWasteDisposal"!=c&&"VendingMachines"!=c||"No"==a[c]||null==a[c]||i.push(c.split(/(?=[A-Z])/).join(" ")+": "+a[c]));for(var d in i)l.push(i[d].replace(": Yes",""));l.sort(),l.forEach(function(e,t){"Recycling Compost Waste Disposal"==e&&(l[t]="Recycling, Compost, and Waste Disposal")}),0==l.length?(document.getElementById("alert_placeholder").innerHTML="",document.getElementById("alert_placeholder").innerHTML='<span class="close"></span>There are not amenities in this building!'):(document.getElementById("alert_placeholder").innerHTML="",document.getElementById("alert_placeholder").innerHTML='<span class="close"></span>List of amenities: <b>'+l.toString().replace(/,/g,", ")+"</b>")}function m(e){var t=B.createQuery();return"Special"==e?(t.where=e+" <> 'null'",B.queryFeatures(t)):(t.where=e+" = 'Yes'",B.queryFeatures(t))}function u(e){document.getElementById("alert_placeholder").style.visibility="visible",document.getElementById("alert_placeholder").innerHTML="",E.removeAll(),console.log(e);var t=e.features.map(function(e){return e.symbol=new s({color:[255,0,0,.6],style:"solid",outline:{color:"red",width:2}}),e}),n=[];for(i=0;i<e.features.length;i++)n.push(e.features[i].attributes.Primary_Building_Name);n.forEach(function(e,t){"Recycling Compost Waste Disposal"==e&&(n[t]="Recycling, Compost, and Waste Disposal")}),document.getElementById("alert_placeholder").innerHTML='<span class="close"></span>List of dormitory: <b>'+n.sort().toString().replace(/,/g,", ")+"</b>",E.addMany(t)}function p(e){var t=B.createQuery();return t.where="Primary_Building_Name = '"+e+"'",B.queryFeatures(t)}function y(e){document.getElementById("alert_placeholder").style.visibility="visible",E.removeAll();var t=e.features.map(function(e){return e.symbol=new s({color:[255,0,0,.6],style:"solid",outline:{color:"red",width:2}}),e}),n=[],r=[],o=e.features[0].attributes;for(var i in o)console.log(i),o.hasOwnProperty(i)&&"object"!=typeof o[i]&&("BottleFiller"!=i&&"CommonRoom"!=i&&"ComputerRoom"!=i&&"Elevator"!=i&&"GameTable"!=i&&"Kitchen"!=i&&"Laundry"!=i&&"MusicPracticeRoom"!=i&&"Printer"!=i&&"Special"!=i&&"StudyRoom"!=i&&"RecyclingCompostWasteDisposal"!=i&&"VendingMachines"!=i||"No"==o[i]||null==o[i]||n.push(i.split(/(?=[A-Z])/).join(" ")+": "+o[i]));for(var l in n)r.push(n[l].replace(": Yes",""));r.forEach(function(e,t){"Recycling Compost Waste Disposal"==e&&(r[t]="Recycling, Compost, and Waste Disposal")}),0==r.length?(document.getElementById("alert_placeholder").innerHTML="",document.getElementById("alert_placeholder").innerHTML='<span class="close"></span>There are not amenities in this building!'):(document.getElementById("alert_placeholder").innerHTML="",document.getElementById("alert_placeholder").innerHTML='<span class="close"></span>List of amenities: <b>'+r.toString().replace(/,/g,", ")+"</b>"),E.addMany(t)}var g=17,h=-71.116076,v=42.37375,f={Android:function(){return navigator.userAgent.match(/Android/i)},BlackBerry:function(){return navigator.userAgent.match(/BlackBerry/i)},iOS:function(){return navigator.userAgent.match(/iPhone|iPad|iPod/i)},Opera:function(){return navigator.userAgent.match(/Opera Mini/i)},Windows:function(){return navigator.userAgent.match(/IEMobile/i)||navigator.userAgent.match(/WPDesktop/i)},any:function(){return f.Android()||f.BlackBerry()||f.iOS()||f.Opera()||f.Windows()}};f.any()&&(g=17,h=-71.117086,v=42.37375);var b=new l({symbol:new s({color:[0,137,252,.4],style:"solid",outline:{width:1,color:"blue"}})}),B=new n({url:"https://map.harvard.edu/arcgis/rest/services/FDO/fdo/MapServer/0",outFields:["*"],visible:!0,renderer:b}),E=new r,w=new e({basemap:"topo",layers:[B,E]}),I=new t({container:"mapViewDiv",map:w,center:[h,v],zoom:g,padding:{top:50,bottom:0},breakpoints:{xsmall:768,small:769,medium:992,large:1200}});I.on("click",function(e){document.getElementById("infoAmenities").options[0].selected=!0;var t=e.screenPoint;I.hitTest(t).then(d),document.getElementById("alert_placeholder").style.visibility="visible"}),document.getElementById("alert_placeholder").addEventListener("click",function(){this.style.visibility="hidden"});var M=document.getElementById("infoAmenities");M.addEventListener("change",function(){m(M.options[M.selectedIndex].value).then(u),document.getElementById("infoDorms").options[0].selected=!0});var L=document.getElementById("infoDorms");L.addEventListener("change",function(){p(L.options[L.selectedIndex].value).then(y),document.getElementById("infoAmenities").options[0].selected=!0})});