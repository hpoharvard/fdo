// code by Giovanni Zambotti - May 2017
require([
      "esri/Map",
      "esri/views/MapView",      
      "esri/widgets/Locate",
      "esri/layers/FeatureLayer",
      "esri/layers/GraphicsLayer",
      "esri/Graphic",
      //"esri/layers/MapImageLayer",
      //"esri/layers/TileLayer",
      "esri/renderers/SimpleRenderer",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/symbols/SimpleFillSymbol",
      "esri/renderers/UniqueValueRenderer",
      "esri/geometry/Extent",
      "esri/widgets/Popup",

      // Bootstrap
      "bootstrap/Dropdown",
      "bootstrap/Collapse",      

      // Calcite Maps
      "calcite-maps/calcitemaps-v0.3",

      "dojo/domReady!"
    ], //function(Map, MapView, FeatureLayer, GraphicsLayer,Graphic, MapImageLayer, TileLayer, SimpleRenderer, SimpleMarkerSymbol, 
      //SimpleFillSymbol, UniqueValueRenderer) {
      function(Map, MapView, Locate, FeatureLayer, GraphicsLayer, Graphic, SimpleRenderer, SimpleMarkerSymbol, 
      SimpleFillSymbol, UniqueValueRenderer, Extent, Popup) { 

      //document.getElementById("foo").style.display = "none"; 
      var myzoom = 17, lon = -71.116076, lat = 42.37375;

      var xMax = -7915458.81211143;
      var xMin = -7917751.9229597915;
      var yMax = 5217414.497463334;
      var yMin = 5216847.191394078;      

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

      if( isMobile.any() ) {
        myzoom = 16; 
        lon = -71.116286; 
        lat = 42.37175;
        xMax = -7916229.045165166; 
        xMin = -7917088.961733397;
        yMax = 5217530.483504136;
        yMin = 5216121.17579509;
      };

      var fdoUrl = "https://map.harvard.edu/arcgis/rest/services/FDO/fdo/MapServer"
      var fdoPopup = { // autocasts as new PopupTemplate()
        title: "{Dorm_Name}",
        //content: "{url}"      
      };
      //var layerBuildingTextUrl = "https://map.harvard.edu/arcgis/rest/services/MapText/MapServer";
      //var layerbaseUrl = "https://map.harvard.edu/arcgis/rest/services/AerialBase/MapServer"
      //var layerbase = new TileLayer({url: layerbaseUrl});
      //var renderer;
      //var layerBuildingText = new MapImageLayer(layerBuildingTextUrl);

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
        layers: [fdoLayer, resultsLayer],

      });

      var view = new MapView({
        container: "mapViewDiv",
        map: map,
        center: [lon, lat], /*-71.11607611178287, 42.37410778220068*/
        zoom: myzoom,        
        padding: {top: 50, bottom: 0}, 
        breakpoints: {xsmall: 768, small: 769, medium: 992, large: 1200},
        /*popup: {
          dockEnabled: true,
          dockOptions: {
            // Disables the dock button from the popup
            buttonEnabled: false,
            // Ignore the default sizes that trigger responsive docking
            breakpoint: false,
            position: 'bottom-right'
          }
        }*/
      });
      
      fdoLayer.popupTemplate = fdoPopup; 
      // Disables map rotation
      view.constraints = {rotationEnabled: false};
                  
      /********************************
      * Create a locate widget object.
      *********************************/        
      var locateBtn = new Locate({view: view});

      // Add the locate widget to the top left corner of the view
      view.ui.add(locateBtn, {position: "top-left"});

      // add on mouse click on a map     
      view.on("click", function(evt) {        
        document.getElementById("alert_placeholder").style.display = "none";
        
        var amenities = document.getElementById("infoAmenities");            
        amenities.options[0].selected = true;        
        var screenPoint = evt.screenPoint;
        view.hitTest(screenPoint).then(getSingleBuilding);        
        //document.getElementById("alert_placeholder").style.visibility = "visible";
        view.popup.content = document.getElementById("alert_placeholder").innerHTML;
        //console.log(view.popup)           
      });
      
      
      /*document.getElementById("alert_placeholder").addEventListener("click", function(){      
        this.style.visibility = "hidden"; 
      });*/
                
      function getSingleBuilding(response) {        
        resultsLayer.removeAll();
        var graphic = response.results[0].graphic;
        var attributes = graphic.attributes;
        
        var name = attributes.Primary_Building_Name;        

        var dorms = document.getElementById("infoDorms");
        for (var i = 0; i < dorms.options.length; i++) {
            //console.log(name, dorms.options[i].value)
            if (dorms.options[i].value === name) {                
                dorms.selectedIndex = i;
                break;
            }
        }
        
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
            if((key == 'BottleFiller' || key == 'CommonRoom' || key == 'ComputerRoom' || key == 'Elevator' || key == 'GameTable' || key == 'Kitchen' || key == 'Laundry' || key == 'MusicPracticeRoom' || key == 'Printer' || key == 'Special' || key == 'StudyRoom' || key == 'RecyclingCompostWasteDisposal' || key == 'VendingMachines' || key == 'Notes' || key == 'url') && obj[key] != 'No' && obj[key] != null ){
                bArray.push(key.split(/(?=[A-Z])/).join(" ") + ": " + obj[key])
            }              
          }
        }
        //console.log(bArray)
        for (var a in bArray){bArrayNew.push(bArray[a].replace(": Yes",""))}

        //bArrayNew.sort();
        //console.log(bArrayNew)

        bArrayNew.forEach(function(part, index) {
          if(part == 'Recycling Compost Waste Disposal'){bArrayNew[index] = "Recycling, Compost, and Waste Disposal";}
        });        
        
        if (bArrayNew.length  == 1) {
          //document.getElementById("alert_placeholder").innerHTML = '';
          //document.getElementById("alert_placeholder").innerHTML = '<span class="close"></span>' + 'There are not amenities in this building!';
          //document.getElementById("panelInfo").className = 'panel collapse in'
          //document.getElementById("panelFilterDorm").className = 'panel collapse in'
          //document.getElementById("panelFilterAmenity").className = 'panel collapse in'          
          //document.getElementsByClassName('panel-label')[0].innerHTML = "List of amenities:"
          document.getElementById("alert_placeholder").innerHTML = '';
          document.getElementById("alert_placeholder").innerHTML = 'There are not amenities in this building!';
          
        }
        else{            
          //document.getElementById("alert_placeholder").innerHTML = '';
          //document.getElementById("alert_placeholder").innerHTML = '<span class="close"></span>' + '<b>List of amenities: </b>' + bArrayNew.toString().replace(/,/g, ', ');                    
          //document.getElementById("panelInfo").className = 'panel collapse in'
          
          /*document.getElementsByClassName('panel-label')[0].innerHTML = "List of amenities:"
          document.getElementById("foo").innerHTML = '';          
          document.getElementById("foo").innerHTML = bArrayNew.toString().replace(/,/g, ', ');*/
          
          document.getElementById("alert_placeholder").innerHTML = '';  
          document.getElementById('alert_placeholder').appendChild(makeUL(bArrayNew));
          
          
        }
      }  
              
      var amenities = document.getElementById("infoAmenities");

      amenities.addEventListener("change", function() {        
        var selectedAmenities = amenities.options[amenities.selectedIndex].value;        
        queryFdo(selectedAmenities).then(displayResults);
        var dorms = document.getElementById("infoDorms");        
        dorms.options[0].selected = true;
        view.popup.visible = false;
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
        //document.getElementById("alert_placeholder").style.visibility = "visible"; 
        //document.getElementById("alert_placeholder").innerHTML = ''; 
        view.extent = new Extent({ xmin: xMin, ymin: yMin, xmax: xMax, ymax: yMax, spatialReference: 102100});       
        
        resultsLayer.removeAll();
        //console.log(results)
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

        bArray.forEach(function(part, index) {
          if(part == 'Recycling Compost Waste Disposal'){bArray[index] = "Recycling, Compost, and Waste Disposal";}
        });

        //document.getElementById("alert_placeholder").innerHTML = '<span class="close"></span>' + '<b>List of dormitory: </b>' + bArray.sort().toString().replace(/,/g, ', ');                    
        document.getElementsByClassName('panel-label')[0].innerHTML = "List of dormitories:";
        document.getElementById("alert_placeholder").innerHTML = bArray.sort().toString().replace(/,/g, ', ');                    
        //document.getElementById("foo").innerHTML = '<b>List of dormitory: </b>' + bArray.sort().toString().replace(/,/g, ', ');                    
        //document.getElementById('results').appendChild(makeUL(bArray.sort()));
        resultsLayer.addMany(features);
      }        
      
      // process the dorms selection     
      var dorms = document.getElementById("infoDorms");

      dorms.addEventListener("change", function() {
        console.log("Dorm change")        
        view.extent = new Extent({ xmin: xMin, ymin: yMin, xmax: xMax, ymax: yMax, spatialReference: 102100});
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
        console.log(view.center);
        
        //document.getElementById("alert_placeholder").style.visibility = "visible"; 
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
        console.log(results.features[0].attributes.Dorm_Name)
        for(var key in obj){
          // skip loop if the property is from prototype
          //console.log(key)
          if(!obj.hasOwnProperty(key)) continue;            
          if(typeof obj[key] !== 'object'){
            if((key == 'BottleFiller' || key == 'CommonRoom' || key == 'ComputerRoom' || key == 'Elevator' || key == 'GameTable' || key == 'Kitchen' || key == 'Laundry' || key == 'MusicPracticeRoom' || key == 'Printer' || key == 'Special' || key == 'StudyRoom' || key == 'RecyclingCompostWasteDisposal' || key == 'VendingMachines' || key == 'Notes' || key == 'url') && obj[key] != 'No' && obj[key] != null ){
            //if((key == 'Laundry' || key == 'Music' || key == 'Kitchen' || key == 'Common' || key == 'Study' || key == 'Computer' ||  key == 'Printer' || key == 'Elevators' || key == 'VendingMachines' || key == 'RecyclingCompost' || key == 'GameTables' || key == 'Special') && obj[key] != 'No' && obj[key] != null ){
                bArray.push(key.split(/(?=[A-Z])/).join(" ") + ": " + obj[key])
            }              
          }
        }
        for (var a in bArray){
          bArrayNew.push(bArray[a].replace(": Yes",""))
        }
        bArrayNew.forEach(function(part, index) {
          if(part == 'Recycling Compost Waste Disposal'){bArrayNew[index] = "Recycling, Compost, and Waste Disposal";}
        });
                
        if (bArrayNew.length  == 0) {
          //document.getElementById("alert_placeholder").innerHTML = '';
          //document.getElementById("alert_placeholder").innerHTML = '<span class="close"></span>' + 'There are not amenities in this building!';                    
          //document.getElementsByClassName('panel-label')[0].innerHTML = "List of amenities:"
          //document.getElementById("alert_placeholder").innerHTML = '';
          //document.getElementById("alert_placeholder").innerHTML = 'There are not amenities in this building!'; 
          document.getElementById("alert_placeholder").innerHTML = '';
          document.getElementById("alert_placeholder").innerHTML = 'There are not amenities in this building!';                   
        }
        else{  
          //document.getElementById("alert_placeholder").innerHTML = '';          
          //document.getElementById("alert_placeholder").innerHTML = '<span class="close"></span>' + '<b>List of amenities: </b>' + bArrayNew.toString().replace(/,/g, ', ');                    
          //document.getElementsByClassName('panel-label')[0].innerHTML = "List of amenities:"
          //document.getElementById("alert_placeholder").innerHTML = '';
          //document.getElementById("alert_placeholder").innerHTML = bArrayNew.toString().replace(/,/g, ', ');                    
          document.getElementById("alert_placeholder").innerHTML = '';  
          document.getElementById('alert_placeholder').appendChild(makeUL(bArrayNew));
        }
        view.popup.location = {latitude: results.features[0].geometry.centroid.latitude, longitude: results.features[0].geometry.centroid.longitude};
        view.popup.title = results.features[0].attributes.Dorm_Name;
        view.popup.visible = true;           
        view.popup.content = document.getElementById("alert_placeholder").innerHTML;          
          
        resultsLayer.addMany(features);   
      }

      // create the list to display values
      
      /*function makeUL(array) {
        var list = "";
        for (var member in array) {
          list += array[member] + ", ";
          } 
          console.log(list)           
        return list;
      } */
      function makeUL(array) {
        var list = document.createElement('ul');
        for(var i = 0; i < array.length; i++) {               
            //console.log(array[i])
            if(!array[i].endsWith('png') && !array[i].startsWith('Notes: ')){      
              
                var item = document.createElement('li');                
                item.appendChild(document.createTextNode(array[i]));               
                list.appendChild(item);              
                         
            }
            else if(array[i].endsWith('png')){
              var dom_img = document.createElement("img");  
              dom_img.src = 'https://map.harvard.edu/images/bldg_photos/' +  array[i].split('url: ')[1];
              list.appendChild(dom_img);
            }
            else{
              var dom_p = document.createElement("p");  
              dom_p.appendChild(document.createTextNode(array[i]));
              list.appendChild(dom_p); 
            }
        }
        /*
        var DOM_img = document.createElement("img");
          DOM_img.src = "http://map.harvard.edu/images/bldg_photos/04935%20WIDENER%20LIBRARY%20n%20elev%20032307.png";

          document.getElementById('foo').appendChild(DOM_img);
        */
        return list;
      }
    });