
var cluster = d3.layout.cluster()
    .size([360, 760 / 2 - 120])
    .sort(null)
    .value(function(d) { return d.size; });

var bundle = d3.layout.bundle();

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(.33)
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });

var viz;
var rows;

var start = function(){
  $('.btn-group').button();
  $('#allButton').click(function(event){
    render(rows);
  });
  $('#parentsButton').click(function(event){
    render(rows,'parent/guardian');
  });
  $('#studentsButon').click(function(event){
    viz.selectAll("g path.link")
      .transition()
      .style("stroke-opacity", function(d){ 
        var a = alpha(d[0]['outLink']['weight']);
        return a;
      });
  });
  $('#communityButton').click(function(event){
    render(rows,'community member');
  });
  $('#staffButton').click(function(event){
    render(rows,'staff member');
  });
  
  viz = d3.select("body").append("svg:svg")
              .attr("width", 1300)
              .attr("height", 760)
            .append("svg:g")
              .attr("transform", "translate(450,380)");
              
  d3.csv("/csv/survey.csv", function(r) {
    rows = r;
    render(rows);
  });
  
  d3.select(self.frameElement).style("height", "760px");
};

var render = function(rows, responseFilter) {
  
  var bucket = true;
  var nodes = cluster(packages.root(rows, bucket));
  
  var alpha = d3.scale.linear().range([0, 1]);
  
  var alpha2 = d3.scale.linear().range([.01, 1]);
  
  var links;
  if(bucket) {
    links = packages.linksBucketed(nodes, rows, responseFilter);
  } else {
    links = packages.links(nodes, rows);
  }

  var w0 = 0;
  var w1 = d3.max(links,
    function(l) {
        return l.weight;
    });
  alpha.domain([w0,w1]);  
  alpha2.domain([w0,w1]);

  function select() {
    return function(g, i) {
      viz.selectAll("g path.link")
        .transition()
          .style("stroke-opacity", 0);

      viz.selectAll("g path.link")
          .filter(function(d) {
            for(var i in d){
              var seg = d[i];
              if(seg.data.name === g.data.name){
                //return true;
              }
              if(seg.outLink !== undefined) {
                if(g.data.name === seg.outLink.source.data.name){
                  return true;
                }
              }
              
              if(seg.inLink !== undefined) {
                if(g.data.name === seg.inLink.target.data.name) {
                  return true;
                }
              }
            }
            return false;
          })
        .transition()
          .style("stroke-opacity", function(d){ 
            var a = alpha2(d[0]['outLink']['weight']);
            return a;
          });
    };
  }

  function deselect() {
    return function(g, i) {
      viz.selectAll("g path.link")
        .style("stroke-opacity", function(d){ 
          var a = alpha(d[0]['outLink']['weight']);
          return a;
        });

    };
  }
  
  
  viz.selectAll("path.link")
      .data(bundle(links))
    .enter().append("svg:path")
      .attr("class", "link")
      .style("stroke-opacity", function(d){ 
        var a = alpha(d[0]['outLink']['weight']);
        return a;
      })
      .attr("d", line);

  viz.selectAll("g.node")
      .data(nodes.filter(function(n) { return n.depth == (bucket ? 2 : 3); }))
    .enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
    .append("svg:text")
      .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
      .attr("dy", ".31em")
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
      .text(function(d) { return d.data.label; })
      .on("mouseover", select())
      .on("mouseout", deselect());
}
