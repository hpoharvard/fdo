// code by Giovanni Zambotti - 20 July 2017
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
      var myzoom = 17, lon = -71.116076, lat = 42.37305;

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
        /*content: "<img src='https://map.harvard.edu/images/bldg_photos/{url}'</img>" + "<p>{Notes}</p>" +
        "<ul><li>Bottle Filler: {BottleFiller}</li><li>Common Room: {CommonRoom}</li><li>Computer Room: {ComputerRoom}</li><li>Elevator: {Elevator}</li><li>Game Table: {GameTable}</li><li>Kitchen: {Kitchen}</li><li>Laundry: {Laundry}</li><li>Music Room: {MusicRoom}</li><li>Printer: {Printer}</li><li>Study Room: {StudyRoom}</li><li>Recycling Compost Stations: {RecyclingCompostStations}</li><li>Vending Machine: {VendingMachine}</li></ul>"      
        */
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
        breakpoints: {xsmall: 768, small: 769, medium: 992, large: 1200}        
      });
      
      //fdoLayer.popupTemplate = fdoPopup; 

      // Disables map rotation
      view.constraints = {rotationEnabled: false};
                  
      /********************************
      * Create a locate widget object.
      *********************************/        
      var locateBtn = new Locate({view: view});

      // Add the locate widget to the top left corner of the view
      view.ui.add(locateBtn, {position: "top-left"});

      // add on mouse click on a map, clear popup and open it     
      view.on("click", function(evt) {
        evt.stopPropagation()
               
        document.getElementById("alert_placeholder").style.display = "none";
        
        var amenities = document.getElementById("infoAmenities");            
        amenities.options[0].selected = true;        
        var screenPoint = evt.screenPoint;
        view.hitTest(screenPoint).then(getSingleBuilding);        
      });
      
      // create the popup and select the building footprint          
      function getSingleBuilding(response) {                
        //fdoLayer.popupTemplate = fdoPopup; 
        resultsLayer.removeAll();
        var graphic = response.results[0].graphic;
        var attributes = graphic.attributes;        
        var name = attributes.Primary_Building_Name;        
        var dorms = document.getElementById("infoDorms");
        for (var i = 0; i < dorms.options.length; i++) {           
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

        var list = document.createElement('ul');
        var obj = attributes;
        console.log(pGraphic.geometry.centroid)
        for(var i in obj){
            
          if (obj[i] == "Yes"){            
            //console.log(obj[i],i);
            var item = document.createElement('li');                
            item.appendChild(document.createTextNode(i.split(/(?=[A-Z])/).join(" ")));               
            list.appendChild(item);
          }
        }

        var zimg = attributes.url;
        var znotes = attributes.Notes;
        var zcontent = "<img width='300px' src='https://map.harvard.edu/images/bldg_photos/" +zimg+ "'</img>" + "<p>" + znotes + "</p>" + list.outerHTML;        
        view.popup.clear(); 
        view.popup.location = {latitude: pGraphic.geometry.centroid.latitude, longitude: pGraphic.geometry.centroid.longitude};
        view.popup.title = name;
        view.popup.content = zcontent;        
        view.popup.visible = true; 
        view.popup.open();       
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
        query.where = myval + " = 'Yes'"
        return fdoLayer.queryFeatures(query);        
      }

      function displayResults(results) {
        view.extent = new Extent({ xmin: xMin, ymin: yMin, xmax: xMax, ymax: yMax, spatialReference: 102100});       
        
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
        
        resultsLayer.addMany(features);
      }        
      
      // process the dorms selection     
      var dorms = document.getElementById("infoDorms");

      dorms.addEventListener("change", function() {
        console.log("Dorm change")
        view.popup.clear();        
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

        var list = document.createElement('ul');
        var obj = results.features[0].attributes;
        //console.log(obj)
        for(var i in obj){
            
          if (obj[i] == "Yes"){
            //delete obj[i]
            console.log(obj[i],i);
            var item = document.createElement('li');                
            item.appendChild(document.createTextNode(i.split(/(?=[A-Z])/).join(" ")));               
            list.appendChild(item);
          }
        }
        view.popup.location = {latitude: results.features[0].geometry.centroid.latitude, longitude: results.features[0].geometry.centroid.longitude};
        view.popup.title = results.features[0].attributes.Dorm_Name;
        var zimg = results.features[0].attributes.url;
        var znotes = results.features[0].attributes.Notes;
        
        var zcontent = "<img width='300px' src='https://map.harvard.edu/images/bldg_photos/" +zimg+ "'</img>" + "<p>" + znotes + "</p>" + list.outerHTML;        
        
        view.popup.content = zcontent;
        
        view.popup.visible = true;              
          
        resultsLayer.addMany(features);   
      }     
      
    });