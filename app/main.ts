import EsriMap = require("esri/Map");
import MapView = require("esri/views/MapView");
import Point = require("esri/geometry/Point");
import FeatureLayer = require("esri/layers/FeatureLayer");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import Graphic = require("esri/Graphic");
import SimpleRenderer = require("esri/renderers/SimpleRenderer");
import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import SimpleFillSymbol = require("esri/symbols/SimpleFillSymbol");
import UniqueValueRenderer = require("esri/renderers/UniqueValueRenderer");
import Extent = require("esri/geometry/Extent");
import Popup = require("esri/widgets/Popup");
import Locate = require("esri/widgets/Locate");

const fdoUrl = "https://map.harvard.edu/arcgis/rest/services/fdo/fdo/MapServer";
/*
const fdoPopup = { // autocasts as new PopupTemplate()
  title: "{Dorm_Name}",
  content: eventHandler    
};
*/      
const buildingRenderer = new SimpleRenderer({
  symbol: new SimpleFillSymbol({
    color: [0,137, 252, 0.4],
    style: "solid",
    outline: {
      width: 1,
      color: "blue"
    }
  })
});

const fdoLayer = new FeatureLayer({
  url: fdoUrl,
  outFields: ["*"],
  visible: true,
  //popupTemplate: fdoPopup,
  renderer: buildingRenderer
});        
// GraphicsLayer for displaying results
const resultsLayer = new GraphicsLayer();

// set up a map
const map = new EsriMap({
  basemap: "topo",
  layers: [fdoLayer, resultsLayer],
});

const view = new MapView({
  map: map,
  container: "mapViewDiv",
  center: new Point({
    x: -71.116076,
    y: 42.37335
  }),
  zoom: 17,
  padding: {top: 50, bottom: 0},
});

/* --------- Set up a click handler for building ----------- */
view.on("click", eventClickBuilding);

function eventClickBuilding(event) {
  //console.log(event)
  event.stopPropagation();
  view.hitTest(event).then(getSingleBuilding);  
  // reset select amenity to the default value
  document.getElementById("alert_placeholder").style.display = "none";        
  let amenities = (document.getElementById("infoAmenities")) as HTMLSelectElement;            
  amenities.options[0].selected = true;  
}

function getSingleBuilding(response) {  
  //console.log(response.results[0].mapPoint.latitude)
  resultsLayer.removeAll();
  view.popup.clear();
  if(response.results.length === 1){
    view.popup.visible = true;
    console.log(response.results.length)
    let graphic = response.results[0].graphic;
    let attributes = graphic.attributes;        
    let name = attributes.Primary_Building_Name;        
  
    let dorms = (document.getElementById("infoDorms")) as HTMLSelectElement;
    
    for (let i = 0; i < dorms.options.length; i++) {           
        if (dorms.options[i].value === name) {                
            dorms.selectedIndex = i;
            break;
        }
    }
    //var graphic = response.results[0].graphic;
    let pGraphic = new Graphic({
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

    let list = document.createElement('ul');
    let obj = attributes;
            
    for(let i in obj){            
      if (obj[i] == "Yes"){            
        //console.log(obj[i],i);
        let item = document.createElement('li');                
        item.appendChild(document.createTextNode(i.split(/(?=[A-Z])/).join(" ")));               
        list.appendChild(item);
      }
    }
  
    // create content for the popup
    let zcontent = "<div><img width='300px' src='https://map.harvard.edu/images/bldg_photos/" + attributes.url + "'</img>" + "<p>" + attributes.Notes + "</p><p>" + list.outerHTML + "</p></div>";        
    
    resultsLayer.add(pGraphic); 
    // Set the location of the popup to the clicked location
    let myCenter = new Point({x: response.results[0].mapPoint.longitude, y: response.results[0].mapPoint.latitude});  
    view.popup.location = myCenter;
    view.popup.open({
      // Set the popup's title to the coordinates of the location
      title: attributes.Dorm_Name,
      content: zcontent  // content displayed in the popup
    });
  }
  else {
    view.popup.visible = false;
  }   
}

// process the amenities pulldown change
const amenities = (document.getElementById("infoAmenities")) as HTMLSelectElement;

amenities.addEventListener("change", function() {        
  let selectedAmenities = amenities.options[amenities.selectedIndex].value;        
  queryFdo(selectedAmenities).then(displayResults);
  let dorms = (document.getElementById("infoDorms")) as HTMLSelectElement;        
  dorms.options[0].selected = true;
  view.popup.visible = false;
});

function queryFdo(myval) {
  let query = fdoLayer.createQuery();
  query.where = myval + " = 'Yes'"
  return fdoLayer.queryFeatures(query);        
}

function displayResults(results) {
  //view.extent = new Extent({ xmin: xMin, ymin: yMin, xmax: xMax, ymax: yMax, spatialReference: 102100});       
  resultsLayer.removeAll();    
  let features = results.features.map(function(graphic) {
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
const dorms = (document.getElementById("infoDorms")) as HTMLSelectElement;

dorms.addEventListener("change", function() {
  //  console.log("Dorm change")
  view.popup.clear();          
  let selectedDorms = dorms.options[dorms.selectedIndex].value;
    
  queryFdoDorms(selectedDorms).then(displayResultsDorms)        
  let amenities = (document.getElementById("infoAmenities")) as HTMLSelectElement;            
  amenities.options[0].selected = true;        
});

function queryFdoDorms(myval) {
  let query = fdoLayer.createQuery();
  query.where = "Primary_Building_Name = '" + myval + "'"
  return fdoLayer.queryFeatures(query);        
}

function displayResultsDorms(results) {   
  resultsLayer.removeAll();
  let features = results.features.map(function(graphic) {
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
    
  let list = document.createElement('ul');
  let obj = results.features[0].attributes;
  //console.log(obj)
  for(let i in obj){            
    if (obj[i] == "Yes"){        
      //console.log(obj[i],i);
      let item = document.createElement('li');                
      item.appendChild(document.createTextNode(i.split(/(?=[A-Z])/).join(" ")));               
      list.appendChild(item);
    }
  }        
  let zimg = results.features[0].attributes.url;
  let znotes = results.features[0].attributes.Notes;        
  let zcontent = "<div><img width='300px' src='https://map.harvard.edu/images/bldg_photos/" +zimg+ "'</img>" + "<p>" + znotes + "</p><p>" + list.outerHTML + "</p></div>";        
  
  let myCenter = new Point({x: results.features[0].geometry.centroid.longitude, y: results.features[0].geometry.centroid.latitude});  
  view.popup.location = myCenter;

  view.popup.open({
    title: results.features[0].attributes.Dorm_Name,
    content: zcontent    
  });        
  resultsLayer.addMany(features);        
}