// code by Giovanni Zambotti - May 2017
require([
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/FeatureLayer",
      "esri/layers/GraphicsLayer",
      "esri/Graphic",
      "esri/layers/MapImageLayer",
      "esri/layers/TileLayer",
      "esri/renderers/SimpleRenderer",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/symbols/SimpleFillSymbol",
      "esri/renderers/UniqueValueRenderer",

      // Bootstrap
      "bootstrap/Dropdown",
      "bootstrap/Collapse",      

      // Calcite Maps
      "calcite-maps/calcitemaps-v0.3",

      "dojo/domReady!"
    ], function(Map, MapView, FeatureLayer, GraphicsLayer,Graphic, MapImageLayer, TileLayer, SimpleRenderer, SimpleMarkerSymbol, 
      SimpleFillSymbol, UniqueValueRenderer) {

      var myzoom = 18, lon = -71.116076, lat = 42.37375;

      var isMobile = {
          Android: function() {
              return navigator.userAgent.match(/Android/i);
          },
          BlackBerry: function() {
              return navigator.userAgent.match(/BlackBerry/i);
          },
          iOS: function() {
              return navigator.userAgent.match(/iPhone|iPad|iPod/i);
          },
          Opera: function() {
              return navigator.userAgent.match(/Opera Mini/i);
          },
          Windows: function() {
              return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
          },
          any: function() {
              return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
          }
      };

      if( isMobile.any() ) {myzoom = 17; lon = -71.117086, lat = 42.37375;};


      var fdoUrl = "https://map.harvard.edu/arcgis/rest/services/FDO/fdo/MapServer/0";
      var layerBuildingTextUrl = "https://map.harvard.edu/arcgis/rest/services/MapText/MapServer";
      var layerbaseUrl = "https://map.harvard.edu/arcgis/rest/services/AerialBase/MapServer"
      var layerbase = new TileLayer({url: layerbaseUrl});
      var renderer;
      var layerBuildingText = new MapImageLayer(layerBuildingTextUrl);

      var buildingRenderer = new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          color: [0,137, 252, 0.4 ],
          style: "solid",
          outline: {
            width: 1,
            color: "blue"
          }
        })
      });
  
      var fdoLayer = new FeatureLayer({
        url: fdoUrl,
        outFields: ["*"],
        visible: true,
        renderer: buildingRenderer
      });        
      // GraphicsLayer for displaying results
      var resultsLayer = new GraphicsLayer();

      var map = new Map({
        basemap: "topo",
        layers: [fdoLayer, resultsLayer]        
      });

      

      var view = new MapView({
        container: "mapViewDiv",
        map: map,
        center: [lon, lat], /*-71.11607611178287, 42.37410778220068*/
        zoom: myzoom,
        padding: {top: 50, bottom: 0}, 
        breakpoints: {xsmall: 768, small: 769, medium: 992, large: 1200}
      });      

      //view.ui.add("infoDiv", "top-right");
      /*view.watch("widthBreakpoint", function(newVal){
        if (newVal === "xsmall"){
          console.log('xsmall')
          view.zoom = 16;
            // clear the view's default UI components if
          // app is used on a mobile device
          //view.ui.components = [];
        }
      });*/

      // add on mouse click on a map     
      view.on("click", function(evt) {
        var amenities = document.getElementById("infoAmenities");            
        amenities.options[0].selected = true;
        var screenPoint = evt.screenPoint;
        view.hitTest(screenPoint).then(getSingleBuilding);        
        document.getElementById("alert_placeholder").style.visibility = "visible";        
      });

    document.getElementById("alert_placeholder").addEventListener("click", function(){      
      this.style.visibility = "hidden"; 

    });
          
      function getSingleBuilding(response) {
        resultsLayer.removeAll();
        var graphic = response.results[0].graphic;
        var attributes = graphic.attributes;
        console.log(attributes)
        var name = attributes.Primary_Building_Name
        
        var pGraphic = new Graphic({
          geometry: response.results[0].graphic.geometry,
          symbol: new SimpleFillSymbol({
            color: [ 255,0, 0, 0.6],
            style: "solid",
            outline: {  // autocasts as esri/symbols/SimpleLineSymbol
              color: "red",
              width: 2
            }
          })
        });
        
        resultsLayer.add(pGraphic);

        var bArray = [];        
        var bArrayNew = [];
        var obj = attributes;
        // filter the object to create a correct list  
        for(var key in obj){
          // skip loop if the property is from prototype
          if(!obj.hasOwnProperty(key)) continue;            
          if(typeof obj[key] !== 'object'){
            if((key == 'Laundry' || key == 'Music' || key == 'Kitchen' || key == 'Common' || key == 'Study' || key == 'Computer' ||  key == 'Printer' || key == 'Elevators' || key == 'VendingMachines' || key == 'RecyclingCompost' || key == 'GameTables' || key == 'Special') && obj[key] != 'No' && obj[key] != null ){
                bArray.push(key.split(/(?=[A-Z])/).join(" ") + ": " + obj[key])
            }              
          }
        }

        for (var a in bArray){
          bArrayNew.push(bArray[a].replace(": Yes",""))
        }

        bArrayNew.sort();
        
        if (bArrayNew.length  == 0) {
          document.getElementById("alert_placeholder").innerHTML = '';
          document.getElementById("alert_placeholder").innerHTML = '<span class="close"></span>' + 'There are not amenities in this building!';

        }
        else{            
          document.getElementById("alert_placeholder").innerHTML = '';
          document.getElementById("alert_placeholder").innerHTML = '<span class="close"></span>' + 'List of amenities: <b>' + bArrayNew.toString().replace(/,/g, ', ') + "</b>";                    
        }
      }  
              
      var amenities = document.getElementById("infoAmenities");

      amenities.addEventListener("change", function() {
        var selectedAmenities = amenities.options[amenities.selectedIndex].value;        
        queryFdo(selectedAmenities).then(displayResults);
        var dorms = document.getElementById("infoDorms");        
        dorms.options[0].selected = true;
      });
     
      function queryFdo(myval) {
        var query = fdoLayer.createQuery();
        if(myval == 'Special'){
          query.where = myval + " <> 'null'"
          return fdoLayer.queryFeatures(query);
        }
        else{
          query.where = myval + " = 'Yes'"
          return fdoLayer.queryFeatures(query);
        } 
      }

      function displayResults(results) {
        document.getElementById("alert_placeholder").style.visibility = "visible"; 
        document.getElementById("alert_placeholder").innerHTML = '';        
        
        resultsLayer.removeAll();
        console.log(results)
        var features = results.features.map(function(graphic) {
          graphic.symbol = new SimpleFillSymbol({
            color: [ 255,0, 0, 0.6],
            style: "solid",
            outline: {  // autocasts as esri/symbols/SimpleLineSymbol
              color: "red",
              width: 2
            }
          });
          return graphic;
        });
        
        var bArray = [];
        for (i = 0; i < results.features.length; i++) { 
          bArray.push(results.features[i].attributes.Primary_Building_Name) 
        };

        document.getElementById("alert_placeholder").innerHTML = 'List of dormitory: <b>' + bArray.sort().toString().replace(/,/g, ', ') + '</b>';                    
        //document.getElementById('results').appendChild(makeUL(bArray.sort()));
        resultsLayer.addMany(features);
      }        
      
      // process the dorms selection     
      var dorms = document.getElementById("infoDorms");

      dorms.addEventListener("change", function() {
        var selectedDorms = dorms.options[dorms.selectedIndex].value;
        queryFdoDorms(selectedDorms).then(displayResultsDorms);
        var amenities = document.getElementById("infoAmenities");            
        amenities.options[0].selected = true;
      });

      function queryFdoDorms(myval) {
        var query = fdoLayer.createQuery();
        query.where = "Primary_Building_Name = '" + myval + "'"
        return fdoLayer.queryFeatures(query);         
      }

      function displayResultsDorms(results) {        
        document.getElementById("alert_placeholder").style.visibility = "visible"; 
        resultsLayer.removeAll();

        var features = results.features.map(function(graphic) {
          graphic.symbol = new SimpleFillSymbol({
            color: [ 255,0, 0, 0.6],
            style: "solid",
            outline: {  // autocasts as esri/symbols/SimpleLineSymbol
              color: "red",
              width: 2
            }
          });
          return graphic;
        });
        
        var bArray = [];
        var bArrayNew = [];      
        
        var obj = results.features[0].attributes;
        for(var key in obj){
          // skip loop if the property is from prototype
          console.log(key)
          if(!obj.hasOwnProperty(key)) continue;            
          if(typeof obj[key] !== 'object'){
            if((key == 'Laundry' || key == 'Music' || key == 'Kitchen' || key == 'Common' || key == 'Study' || key == 'Computer' ||  key == 'Printer' || key == 'Elevators' || key == 'VendingMachines' || key == 'RecyclingCompost' || key == 'GameTables' || key == 'Special') && obj[key] != 'No' && obj[key] != null ){
                bArray.push(key.split(/(?=[A-Z])/).join(" ") + ": " + obj[key])
            }              
          }
        }
        for (var a in bArray){
          bArrayNew.push(bArray[a].replace(": Yes",""))
        }
        //console.log(bArrayNew)
        if (bArrayNew.length  == 0) {
          document.getElementById("alert_placeholder").innerHTML = '';
          document.getElementById("alert_placeholder").innerHTML = 'There are not amenities in this building!';                    
        }
        else{  
          document.getElementById("alert_placeholder").innerHTML = '';          
          document.getElementById("alert_placeholder").innerHTML = 'List of amenities: <b>' + bArrayNew.toString().replace(/,/g, ', ') + "</b>";                    
        }
        resultsLayer.addMany(features);   
      }

      // create the list to display values
      /*
      function makeUL(array) {
        var list = "";
        for (var member in array) {
          list += array[member] + ", ";
          } 
          console.log(list)           
        return list;
      }*/  
      /*function makeUL(array) {
        var list = document.createElement('ul');
        for(var i = 0; i < array.length; i++) {               
            var item = document.createElement('li');                
            item.appendChild(document.createTextNode(array[i]));               
            list.appendChild(item);
        }            
        return list;
      }*/
    });