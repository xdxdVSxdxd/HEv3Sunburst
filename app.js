$( document ).ready(function() {
	$("#genbut").click(function(){  generate(); });
});


var colors;

// {
//   // "home": "#5687d1",
//   // "product": "#7b615c",
//   // "search": "#de783b",
//   // "account": "#6ab975",
//   // "other": "#a173d1",
//   // "end": "#bbbbbb"
// };


	var gfxwidth = $("#gfxwidth").val();
	var gfxheight = $("#gfxheight").val();
	var dataurl = $("#dataurl").val();
	var mainarrayname = $("#mainarrayname").val();
	var topicfieldname = $("#topicfieldname").val();
	var weightfieldname = $("#weightfieldname").val();

	var drawlabels = false;

	var totalSize = 0;

	var vis;


var x = d3.scaleLinear()
    .range([0, 2 * Math.PI]);

    var y;

function generate(){
	gfxwidth = $("#gfxwidth").val();
	gfxheight = $("#gfxheight").val();
	dataurl = $("#dataurl").val();
	mainarrayname = $("#mainarrayname").val();
	topicfieldname = $("#topicfieldname").val();
	weightfieldname = $("#weightfieldname").val();


	drawlabels = $("#drawlabels").prop( "checked" ) ;


	$("#vizholder").html("");

	$("#vizholder").width(gfxwidth);
	$("#vizholder").height(gfxheight);

	d3.json("proxy.php?url=" + dataurl,
		function(data){

			var svg = d3.select("#vizholder").append("svg")
		      .style("width",  "100%" )
		      .style("height",  d3.select("#vizholder").style("height") );

		    
		    var margin = {top: 0, right: 20, bottom: 0, left: 20},
		    width = +svg.style("width").replace("px","") - margin.left - margin.right,
		    height = +svg.style("height").replace("px","") - margin.top - margin.bottom;

		    vis = svg.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		    .append("svg:g")
		    .attr("id", "containero")
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


		    $("#explanation").css("top", -gfxwidth/2 - $("#explanation").height()/2 );
		    $("#explanation").css("left", gfxheight/2 - $("#explanation").width()/2 );

			var radius = Math.min(width, height) / 2;

			y = d3.scaleLinear()
					.range([0, radius]);

			totalSize = 0; 

			var partition = d3.partition()
    			.size([2 * Math.PI, radius * radius]);

    		var arc = d3.arc()
			    .startAngle(function(d) { return d.x0; })
			    .endAngle(function(d) { return d.x1; })
			    .innerRadius(function(d) { return Math.sqrt(d.y0); })
			    .outerRadius(function(d) { return Math.sqrt(d.y1); });

			var json = buildHierarchy(data);

			//console.log(json);

			vis.append("svg:circle")
				.attr("r", radius)
				.style("opacity", 0);
  			

  			var root = d3.hierarchy(json)
				.sum(function(d) { return d.size; })
				.sort(function(a, b) { return b.value - a.value; });

			var nodes = partition(root).descendants()
				.filter(function(d) {
				  return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
				});

			var g = vis.data([json]).selectAll("path")
				.data(nodes)
				.enter().append("g")

			var path = g.append("svg:path")
				.attr("display", function(d) { return d.depth ? null : "none"; })
				.attr("d", arc)
				.attr("fill-rule", "evenodd")
				.style("fill", function(d) { return colors[d.data.name]; })
				.style("opacity", 1)
				.on("mouseover", mouseover);


			if(drawlabels){
				var text = g.append("text")
				.attr("transform", function(d) { 
		             return "rotate(" + computeTextRotation(d) + ")"; 
		          })
		          .attr("x", function(d) { 
		          		var xx = Math.sqrt(d.y0);
		             return xx;
		             //return y(d.y0); 
		          })
		          .attr("dx", "6") // margin
		          .attr("dy", ".35em") // vertical-align
		          .text(function(d) { 
		              return d.data.name === "root" ? "" : d.data.name
		          });	
			}
			

			d3.select("#containero").on("mouseleave", mouseleave);

			totalSize = path.datum().value;

		    $("#SVGexport").val(  $("#vizholder").html() );

		});
}

function mouseover(d) {

	var percentage = (100 * d.value / totalSize).toPrecision(3);
	var percentageString = percentage + "%";
	if (percentage < 0.1) {
		percentageString = "< 0.1%";
	}
	d3.select("#percentage")
      .text(percentageString);

  	d3.select("#explanation")
      .style("visibility", "");


    d3.select("#elementsnames")
    	.text(d.data.name);

    d3.selectAll("path")
      .style("opacity", 0.3);

    var sequenceArray = d.ancestors().reverse();

    vis.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
}


function mouseleave(d) {

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("path")
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .on("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });

  d3.select("#explanation")
      .style("visibility", "hidden");
}


function buildHierarchy(data) {
	var root = {"name": "root", "children": []};

	var labels = new Array();

	for(var i = 0; i<data[mainarrayname].length; i++){
		var elementName = data[mainarrayname][i][topicfieldname];
		var elementWeight = +data[mainarrayname][i][weightfieldname];

		if( $.inArray(elementName,labels)==-1 ){
			labels.push(elementName);
		}

		var element = { "name" : elementName, "size": elementWeight, "children": [ ] };

		for(var j = 0; j<data[mainarrayname][i].children.length; j++){
			var subelementName = data[mainarrayname][i].children[j][topicfieldname];
			var subelementWeight = +data[mainarrayname][i].children[j][weightfieldname];

			if( $.inArray(subelementName,labels)==-1 ){
				labels.push(subelementName);
			}

			var subelement = { "name" : subelementName, "size": subelementWeight, "children": [ ] };

			element.children.push(subelement);

		}
		root.children.push(element);
	}

	var colori = d3.scaleOrdinal(d3.schemeCategory20b);

	colors = new Object();

	for(var i = 0; i<labels.length; i++){
		colors[labels[i]] = colori( i%20  );
	}



	return root;
}


function computeTextRotation(d) {
  return ((d.x0 + d.x1)/2 - Math.PI / 2) / Math.PI * 180;
}