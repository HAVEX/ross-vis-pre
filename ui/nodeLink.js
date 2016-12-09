define(["d3"], function(d3){
    return function nodeLinkGraph(option){
        var width = option.width || 460,
            height = option.height || 350,
            data = option.data || [],
            container = option.container || "body";

        var n = 100,
            nodes = data.nodes,
            links = data.links.sort(function(a,b){return a.value - b.value;});

        var force = d3.layout.force()
            .nodes(nodes)
            .links(links)
            .size([width, height]);

        var maxValue = d3.max(links.map(function(l){ return l.value;})),
            minValue = d3.min(links.map(function(l){ return l.value;}));

        var maxERB = d3.max(nodes.map(function(l){ return l.events_rolled_back;})),
            minERB = d3.min(nodes.map(function(l){ return l.events_rolled_back;}));

        var linkWidth = d3.scale.linear().domain([minValue, maxValue]).range([0.2,5]);
        var linkColor = d3.scale.linear().domain([minValue, maxValue]).range(["#CCC", "#E00"]);

        // var colorScale = d3.scale.linear().domain([0,15]).range(["#0F0", "#010"]);
        var colorScale = d3.scale.category20();

        // var nodeSize = d3.scale.linear().domain([minERB,maxERB]).range([1,10]);

        var nodeColor = {
            server: "green",
            terminal:  "#AA0",
            router: "purple"
        };

        force.linkStrength(function(link) {

            var strength =  2 ;
            if(link.source.PE === link.target.PE) {
                strength = 0.5;
                link.value *=2;
            }
            return strength;

        })
        // force.gravity(0.1);
        force.linkDistance(height/2);

        var svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height);


        setTimeout(function() {

          force.start();
          for (var i = n * n; i > 0; --i) force.tick();
          force.stop();

          svg.selectAll("line")
              .data(links)
            .enter().append("line")
              .style("stroke", function(d) { return linkColor(d.value);})
              .style("stroke-width", function(d) { return linkWidth(d.value);})
              .attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          svg.selectAll("circle")
              .data(nodes)
            .enter().append("circle")
              .style("fill", function(d){return nodeColor[d.LP_type]})
              .attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; })
              .attr("r", 4.5);

        }, 10);
    }
})
