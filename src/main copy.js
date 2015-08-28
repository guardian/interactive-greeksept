/// <reference path="../typings/jquery/jquery.d.ts"/>
var getJSON = require('./js/utils/getjson');
var d3 = require('d3');
var $ = require('jquery');
var template = require('./html/base.html');
var widgettemplate = require('./html/widget.html');
var topojson = require('topojson');
var greece = require('./data/topo.json');
var textures = require('textures')
var localdata = require('./data/results.json')

var app;
var results;

var yes = "170, 216, 1", no = "220, 42, 125", tie = "200, 200, 200";

/**
 * Update app using fetched JSON data
 * @param {object:json} data - JSON spreedsheet data.
 */


  

function updateView(data) {
  results = data.sheets.results;
  loadmap(results);
  // loadlist(results);
  loadsummary(results);
};

function runWidget(data) {
  results = data.sheets.results;  
  loadsummary(results);
  $(".widget").click(function () {
//  alert('clicked');
  window.parent.location.href = 'http://gu.com/p/4abvp';
 });

};

function updateWidget (data) {
  results = data.sheets.results;  
  updatesummary(results);
}

function updatesummary (results) {
  var totals = results.find(function (d) {
    return d.region == "Total";
  });

  var yespercent = totals.yes;
  var nopercent = totals.no;

  var yesbar = d3.select("#yesbar").style("width", yespercent+'%');
  yesbar.select(".result").attr("class","result").text(yespercent+"%");

  var nobar = d3.select("#nobar").style("width", nopercent+'%');
  nobar.select(".result").attr("class","result").text(nopercent+"%");

  var declarationcount = totals.percentreporting; 
  var declarationcountmessage = "With " + declarationcount + "% of votes reported"; 
  $('.strip').css('display','block');
  $('#declarationcount').text(declarationcountmessage);

}


function loadsummary(results) {
 var totals = results.find(function (d) {
    return d.region == "Total";
  });
  
  var yespercent = totals.yes;
  var nopercent = totals.no;

  var yesbar = d3.select("#yesbar").style("width", yespercent+'%');
  yesbar.append("p").attr("class","answer").text("Yes")
  yesbar.append("p").attr("class","result").text(yespercent+"%");

  var nobar = d3.select("#nobar").style("width", nopercent+'%');
  nobar.append("p").attr("class","answer").text("No");
  nobar.append("p").attr("class","result").text(nopercent+"%");

  var declarationcount = totals.percentreporting; 
  var declarationcountmessage = (totals.percentreporting !== "")?"With " + declarationcount + "% of votes reported":"No results yet"; 

  $('.strip').css('display','block');
  $('#declarationcount').text(declarationcountmessage);
  $('#declarationcount2').text(declarationcountmessage);
  $('#declarationcount3').text(declarationcountmessage);
};

// function shareBtns () {

//     shareUrl = "http://gu.com/p/4abvp"
//     document.getElementById('share-btns').addEventListener('click', function(evt) {
//             if (/button/i.test(evt.target.nodeName)) {
//                 if (evt.target.getAttribute('data-source') === 'facebook') {
//                     window.open(fburl(), 'share', 'width=600,height=200');
//                 } else if (evt.target.getAttribute('data-source') === 'twitter') {
//                     window.open(twurl(), 'share', 'width=600,height=200');
//                 }
//             }
//     }.bind(this))
// }

// function fburl () {
//   var facebookParams = [
//             ['display', 'popup'],
//             ['app_id', '741666719251986'],
//             ['link', encodeURIComponent(shareUrl)],
//             ['redirect_uri', 'http://www.facebook.com']
//         ];
//    var queryString = facebookParams.map(function (pair) { return pair.join('=')}).join('&');

//    return 'https://www.facebook.com/dialog/feed?' + queryString;
// }

// function twurl () {
//   return "https://twitter.com/intent/tweet?text="+twresult+" Follow the live results from the Greek referendum "+shareUrl+"#greferendum";
// }


function drawMapKey() {
  formatPercent = d3.format(".0%"),
  formatNumber = d3.format(".0f");

  var threshold = d3.scale.threshold()
    .domain([-0.1, -.05, .0, .05, .1])
    .range(["#529000","#aad801","#dcef95","#f5c1d9","#e55c9b","#ae0046"]);

  // A position encoding for the key only.
  var x = d3.scale.linear()
      .domain([-0.15, .15])
      .range([0, 150]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickSize(13)
      .tickValues(threshold.domain())
      .tickFormat(function(d) { return d === .5 ? formatPercent(Math.abs(d)) : formatNumber(100 * Math.abs(d)); });

  var svg = d3.select("#mapkey").append("svg")
      .attr("width", 150)
      .attr("height", 50);

  var g = svg.append("g")
      .attr("class", "key")
      .attr("transform", "translate(0," + 20 + ")");

  g.selectAll("rect")
      .data(threshold.range().map(function(color) {
        var d = threshold.invertExtent(color);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      }))
    .enter().append("rect")
      .attr("height", 8)
      .attr("x", function(d) { return x(d[0]); })
      .attr("width", function(d) { return x(d[1]) - x(d[0]); })
      .style("fill", function(d) { return threshold(d[0]); });

  g.call(xAxis).append("text")
      .attr("class", "caption")
      .attr("y", -6)
      .text("% point difference");
}

function loadmap(results) {

  var withcommas = d3.format(",");
    
  // shareBtns();

  drawMapKey();

	var svg, width, height, projection, path;

  var dataset;

  var choro = ["#529000","#aad801","#dcef95","#f5c1d9","#e55c9b","#ae0046"]


  d3.select("#yes").select(".col2").html((results[0].yes !== "")?results[0].yes+"%":"—")
  d3.select("#yesvotes").select(".col2").html((results[0].yesvotes !== "")?withcommas(results[0].yesvotes):"—")
  d3.select("#no").select(".col2").html((results[0].no !== "")?results[0].no+"%":"—")
  d3.select("#novotes").select(".col2").html((results[0].novotes !== "")?withcommas(results[0].novotes):"—")
  d3.select("#turnout").select(".col2").html((results[0].turnout !== "")?results[0].turnout+"%":"—")

  function sizeChange() {
    d3.select(".greece").attr("transform", "scale(" + $("#greecemap").width() / 480 + ")");
    $("#greecemapSvg").height($("#greecemap").height());
    $("#greecemapSvg").width($("#greecemap").width());
  }

  $(document).ready(function () {
    
    d3.selection.prototype.moveToFront = function () {
      return this.each(function () {
        this.parentNode.appendChild(this);
      });
    };

    d3.select("#greecemap").append("div")
      .attr("class", "constituency");

    width = $("#greecemap").width();
    height = $("#greecemap").width();

    d3.select(window)
      .on("resize", sizeChange);

    projection = d3.geo.mercator()
      .scale(2980)
      .translate([-30, 2170]);

    path = d3.geo.path()
      .projection(projection);

    svg = d3.select("#greecemap").append("svg")
      .attr("id", "mapSvg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("class", "greece")
      .attr("transform", "scale(" + $("#greecemap").width() / 480 + ")");

      var hash = textures.lines()
        .size(4)
        .strokeWidth(1)
        .stroke("#aaa")
        .background("#e1e1e1");

      var hashequal = textures.lines()
        .size(4)
        .strokeWidth(1)
        .stroke("#97ba02")
        .orientation("6/8")
        .background("#f5c1d9");

      svg.call(hash)
        .call(hashequal)

      svg.selectAll(".region")
        .data(topojson.feature(greece, greece.objects.collection).features)
        .enter().append("path")
        .attr("id", function (d) { return d.properties.name; })
        .attr("d", path)
        .attr("stroke", "rgba(255,255,255,0.4)")
        .attr("stroke-width", 1)
        .attr("fill", function (d) {
          var color;
          var region = results.find(function (r) { return d.properties.name == r.region;});
          if(region) {
            if(region.yes !== "" || region.no !== ""){
              var hue = (region.yes>region.no)?"yes":"no";
              var diff = Math.abs(region.yes - region.no);
              
              switch (true) {
                case (hue=="yes") && (diff>10):
                  color = choro[0];
                break;
                case (hue=="yes") && (diff>5):
                  color = choro[1];
                break;
                case (hue=="yes") && (diff>0):
                  color = choro[2];
                break;
                case (hue=="no") && (diff>10):
                  color = choro[5];
                break;
                case (hue=="no") && (diff>5):
                  color = choro[4];
                break;
                case (hue=="no") && (diff>0):
                  color = choro[3];
                break;
                default:
                color = hashequal.url();
              }

            } else {
                color = hash.url()

            }
            
          } else {
            color = "#767676"
          }
          
          return color

        })
        .on("mouseover", function (d, i) {

          var reg = new RegExp('^[0-9]+$')

          var region = results.find(function (r) { return d.properties.name == r.region;});

          var constituency = d.properties.name;
          d3.select(this).moveToFront().attr("stroke", "rgba(0, 0, 0, 1)");

          var tt = d3.select("#tooltip")
            tt.select(".constituency").html(region.displayregion);
            tt.select(".yes")
              .classed("winner",(region.yes > region.no)?true:false)
              .html((region.yes!="")?"Yes "+region.yes+"%":"Yes –")

            tt.select(".no")
              .classed("winner", (region.no > region.yes)?true:false)
              .html((region.no!="")?"No "+region.no+"%":"No –")

            tt.select(".reporting").html((region.percentreporting!=="")?region.percentreporting+"% of votes reported":"No results yet");

            d3.select("#tooltip").style("display","block");

            var s = d3.select("#mapSvg").select(".greece").attr("transform");
            var sc = s.slice(6,s.length-1);

            var left = (path.centroid(d)[0]+20)*sc, top = path.centroid(d)[1]*sc;

            d3.select("#tooltip").style("left",left+"px");
            d3.select("#tooltip").style("top",top+"px");
            
      })
        .on("mouseout", function (d, i) {
          d3.select(this).attr("stroke", "rgba(255,255,255,0.4)");
          d3.select("#tooltip").style("display","none");
      });
  });

}


// function loadlist(results) {

//   $.each(results, function addlistitem() {
//     resultitem = this.displayregion + " Yes: " + this.yes + "No :" + this.no;
//     newitem = document.createElement("li");
//     $(newitem).text(resultitem).appendTo('#list');

//   });
//   // $('#list').text(results);
    
// };
  

/**
 * Boot the app.
 * @param {object:dom} el - <figure> element passed by boot.js. 
 */
 
 
function loadwidget (el) {
  el.innerHTML = widgettemplate;
  var key = '1_LAw_p3PcjSH-IR_dQtkaqFLBbEK1v-mubU9sqaLNG4';
  var url = '//visuals.guim.co.uk/spreadsheetdata/' + key + '.json';
  getJSON(url, runWidget);
  console.log('first run')
  setInterval(function() {
  var key = '1_LAw_p3PcjSH-IR_dQtkaqFLBbEK1v-mubU9sqaLNG4';
  var url = '//visuals.guim.co.uk/spreadsheetdata/' + key + '.json';
  getJSON(url, updateWidget);  
 //console.log('funning');
},30000);
}
 
 
function boot(el,context) {

  if (location.search !=="?testing" && context === "iframed") {
    console.log("widget version");
    loadwidget(el);} 
    else {
 
  el.innerHTML = template;
  //  var key = '1_LAw_p3PcjSH-IR_dQtkaqFLBbEK1v-mubU9sqaLNG4';
  // var url = '//visuals.guim.co.uk/spreadsheetdata/' + key + '.json';
  //getJSON(url, updateView);
//  console.log('localdata',localdata);
  updateView(localdata);
  
}};

	if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}


// DO NOT DELETE - needed for boot.js to work.
define(function () { return { boot: boot }; });
