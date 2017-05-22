define(function(){
    return function chord(option) {
        var width = option.width || 800,
            height = option.height || 800,
            data = option.data || [],
            container = option.container || "body";

        var matrix = data.matrix;

        matrix.forEach(function(row,i){
            row.forEach(function(col, j){
                if(i == j) matrix[i][j] = 0;
            })
        })

        var outerRadius = Math.min(width, height) * 0.5 - 30,
            innerRadius = outerRadius - 30;

        var formatValue = d3.formatPrefix(",.0", 1e3);

        var chord = d3.layout.chord()
            .padding(.03)
            .sortSubgroups(d3.descending);

        var arc = d3.svg.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        chord.matrix(matrix);
        var fill = d3.scale.category20();


        // var rollbacks = data.nodes.map(function(d){ return d.total_rollbacks;}),
        //     minRB = d3.min(rollbacks),
        //     maxRB = d3.max(rollbacks),
        //     colorScale = d3.scale.linear().domain([minRB, maxRB]).range([['#EEE', "orange"]]);

        var svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", "chordChart")
          .append("g")
            .attr("transform", "translate(" + (width / 2 ) + "," + (height / 2 ) + ")");


        var g = svg.selectAll(".group")
            .data(chord.groups)
          .enter().append("g")
            .attr("class", "group");

        g.append("path")
            .style("fill", function(d) { return fill(d.index); })
            // .style("fill", function(d) { return colorScale(d.source.total_rollbacks); })
            .style("stroke", function(d) { return fill(d.index); })
            .attr("d", arc);

        g.append("text")
            .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
            .attr("dy", ".35em")
            .attr("transform", function(d) {
              return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                  + "translate(" + (innerRadius + 36) + ")"
                  + (d.angle > Math.PI ? "rotate(180)" : "");
            })
            .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
            .style("font-size", "10px")
            .text(function(d,i){ return "PE" + data.nodes[i].PE_ID});

        svg.selectAll(".chord")
            .data(chord.chords)
          .enter().append("path")
            .attr("class", "chord")
            .style("stroke", function(d) { return d3.rgb(fill(d.source.index)).darker(); })
            .style("fill", function(d) { return fill(d.source.index); })
            // .style("fill", function(d) { return colorScale(d.source.total_rollbacks); })
            .attr("d", d3.svg.chord().radius(innerRadius));

        // if(typeof container.parentElement.hideLoading === "function")
        //     container.parentElement.hideLoading();
    }
})
