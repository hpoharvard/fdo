define(["require", "exports", "esri/Map", "esri/views/MapView", "esri/geometry/Point", "esri/layers/FeatureLayer", "esri/layers/GraphicsLayer", "esri/Graphic", "esri/renderers/SimpleRenderer", "esri/symbols/SimpleFillSymbol"], function (require, exports, EsriMap, MapView, Point, FeatureLayer, GraphicsLayer, Graphic, SimpleRenderer, SimpleFillSymbol) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var fdoUrl = "https://map.harvard.edu/arcgis/rest/services/fdo/fdo/MapServer";
    /*
    const fdoPopup = { // autocasts as new PopupTemplate()
      title: "{Dorm_Name}",
      content: eventHandler
    };
    */
    var buildingRenderer = new SimpleRenderer({
        symbol: new SimpleFillSymbol({
            color: [0, 137, 252, 0.4],
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
        //popupTemplate: fdoPopup,
        renderer: buildingRenderer
    });
    // GraphicsLayer for displaying results
    var resultsLayer = new GraphicsLayer();
    // set up a map
    var map = new EsriMap({
        basemap: "topo",
        layers: [fdoLayer, resultsLayer],
    });
    var view = new MapView({
        map: map,
        container: "mapViewDiv",
        center: new Point({
            x: -71.116076,
            y: 42.37335
        }),
        zoom: 17,
        padding: { top: 50, bottom: 0 },
    });
    /* --------- Set up a click handler for building ----------- */
    view.on("click", eventClickBuilding);
    function eventClickBuilding(event) {
        //console.log(event)
        event.stopPropagation();
        view.hitTest(event).then(getSingleBuilding);
        // reset select amenity to the default value
        document.getElementById("alert_placeholder").style.display = "none";
        var amenities = (document.getElementById("infoAmenities"));
        amenities.options[0].selected = true;
    }
    function getSingleBuilding(response) {
        //console.log(response.results[0].mapPoint.latitude)
        resultsLayer.removeAll();
        view.popup.clear();
        if (response.results.length === 1) {
            view.popup.visible = true;
            console.log(response.results.length);
            var graphic = response.results[0].graphic;
            var attributes = graphic.attributes;
            var name_1 = attributes.Primary_Building_Name;
            var dorms_1 = (document.getElementById("infoDorms"));
            for (var i = 0; i < dorms_1.options.length; i++) {
                if (dorms_1.options[i].value === name_1) {
                    dorms_1.selectedIndex = i;
                    break;
                }
            }
            //var graphic = response.results[0].graphic;
            var pGraphic = new Graphic({
                geometry: response.results[0].graphic.geometry,
                symbol: new SimpleFillSymbol({
                    color: [255, 0, 0, 0.6],
                    style: "solid",
                    outline: {
                        color: "red",
                        width: 2
                    }
                })
            });
            var list = document.createElement('ul');
            var obj = attributes;
            for (var i in obj) {
                if (obj[i] == "Yes") {
                    //console.log(obj[i],i);
                    var item = document.createElement('li');
                    item.appendChild(document.createTextNode(i.split(/(?=[A-Z])/).join(" ")));
                    list.appendChild(item);
                }
            }
            // create content for the popup
            var zcontent = "<div><img width='300px' src='https://map.harvard.edu/images/bldg_photos/" + attributes.url + "'</img>" + "<p>" + attributes.Notes + "</p><p>" + list.outerHTML + "</p></div>";
            resultsLayer.add(pGraphic);
            // Set the location of the popup to the clicked location
            var myCenter = new Point({ x: response.results[0].mapPoint.longitude, y: response.results[0].mapPoint.latitude });
            view.popup.location = myCenter;
            view.popup.open({
                // Set the popup's title to the coordinates of the location
                title: attributes.Dorm_Name,
                content: zcontent // content displayed in the popup
            });
        }
        else {
            view.popup.visible = false;
        }
    }
    // process the amenities pulldown change
    var amenities = (document.getElementById("infoAmenities"));
    amenities.addEventListener("change", function () {
        var selectedAmenities = amenities.options[amenities.selectedIndex].value;
        queryFdo(selectedAmenities).then(displayResults);
        var dorms = (document.getElementById("infoDorms"));
        dorms.options[0].selected = true;
        view.popup.visible = false;
    });
    function queryFdo(myval) {
        var query = fdoLayer.createQuery();
        query.where = myval + " = 'Yes'";
        return fdoLayer.queryFeatures(query);
    }
    function displayResults(results) {
        //view.extent = new Extent({ xmin: xMin, ymin: yMin, xmax: xMax, ymax: yMax, spatialReference: 102100});       
        resultsLayer.removeAll();
        var features = results.features.map(function (graphic) {
            graphic.symbol = new SimpleFillSymbol({
                color: [255, 0, 0, 0.6],
                style: "solid",
                outline: {
                    color: "red",
                    width: 2
                }
            });
            return graphic;
        });
        resultsLayer.addMany(features);
    }
    // process the dorms selection     
    var dorms = (document.getElementById("infoDorms"));
    dorms.addEventListener("change", function () {
        //  console.log("Dorm change")
        view.popup.clear();
        var selectedDorms = dorms.options[dorms.selectedIndex].value;
        queryFdoDorms(selectedDorms).then(displayResultsDorms);
        var amenities = (document.getElementById("infoAmenities"));
        amenities.options[0].selected = true;
    });
    function queryFdoDorms(myval) {
        var query = fdoLayer.createQuery();
        query.where = "Primary_Building_Name = '" + myval + "'";
        return fdoLayer.queryFeatures(query);
    }
    function displayResultsDorms(results) {
        resultsLayer.removeAll();
        var features = results.features.map(function (graphic) {
            graphic.symbol = new SimpleFillSymbol({
                color: [255, 0, 0, 0.6],
                style: "solid",
                outline: {
                    color: "red",
                    width: 2
                }
            });
            return graphic;
        });
        var list = document.createElement('ul');
        var obj = results.features[0].attributes;
        //console.log(obj)
        for (var i in obj) {
            if (obj[i] == "Yes") {
                //console.log(obj[i],i);
                var item = document.createElement('li');
                item.appendChild(document.createTextNode(i.split(/(?=[A-Z])/).join(" ")));
                list.appendChild(item);
            }
        }
        var zimg = results.features[0].attributes.url;
        var znotes = results.features[0].attributes.Notes;
        var zcontent = "<div><img width='300px' src='https://map.harvard.edu/images/bldg_photos/" + zimg + "'</img>" + "<p>" + znotes + "</p><p>" + list.outerHTML + "</p></div>";
        var myCenter = new Point({ x: results.features[0].geometry.centroid.longitude, y: results.features[0].geometry.centroid.latitude });
        view.popup.location = myCenter;
        view.popup.open({
            title: results.features[0].attributes.Dorm_Name,
            content: zcontent
        });
        resultsLayer.addMany(features);
    }
});
//# sourceMappingURL=main.js.map