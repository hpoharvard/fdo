require(["esri/Map","esri/views/MapView","esri/layers/FeatureLayer","esri/layers/GraphicsLayer",
        "esri/Graphic","esri/symbols/SimpleFillSymbol","esri/symbols/SimpleMarkerSymbol","esri/renderers/SimpleRenderer",
        "esri/renderers/UniqueValueRenderer","esri/layers/MapImageLayer","esri/layers/TileLayer",
        "dojo/on","dojo/dom","dojo/dom-construct","dojo/domReady!"
      ],
function(
  Map, MapView,FeatureLayer,GraphicsLayer,Graphic,SimpleFillSymbol,SimpleMarkerSymbol,
  SimpleRenderer,UniqueValueRenderer,MapImageLayer,TileLayer,on, dom, domConstruct
) {
  
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
    //layers: [fdoLayer, resultsLayer, layerBuildingText]
  });

  var view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-71.116076, 42.37375], /*-71.11607611178287, 42.37410778220068*/
    zoom: 18
  });
  view.ui.add("infoDiv", "top-right");

  // add on mouse click
  view.on("click", function(evt) {
    var amenities = document.getElementById("infoamenities");    
    amenities.options[0].selected = true;
    var screenPoint = evt.screenPoint;
    view.hitTest(screenPoint).then(getSingleBuilding);
  });

  function getSingleBuilding(response) {
    resultsLayer.removeAll();
    var graphic = response.results[0].graphic;
    var attributes = graphic.attributes;
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
    //console.log(bArrayNew.length)
    if (bArrayNew.length  == 0) {
      document.getElementById("results").innerHTML = '';
      document.getElementById("results").innerHTML = 'There are not amenities in this building!';                    
    }
    else{  
      document.getElementById("results").innerHTML = '';
      document.getElementById("results").innerHTML = 'List of amenities:';          
      document.getElementById('results').appendChild(makeUL(bArrayNew));
    }
  }  
    
  var amenities = document.getElementById("infoamenities");

  amenities.addEventListener("change", function() {
    var selectedAmenities = amenities.options[amenities.selectedIndex].value;
    //console.log(selectedAmenities);
    queryFdo(selectedAmenities).then(displayResults);
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
    document.getElementById("results").innerHTML = '';
    document.getElementById("results").innerHTML = 'List of buildings:';
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

    document.getElementById('results').appendChild(makeUL(bArray.sort()));
    resultsLayer.addMany(features);
  }        

  // create the list to display values  
  function makeUL(array) {
    var list = document.createElement('ul');
    for(var i = 0; i < array.length; i++) {               
        var item = document.createElement('li');                
        item.appendChild(document.createTextNode(array[i]));               
        list.appendChild(item);
    }            
    return list;
  }  

});
