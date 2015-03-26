var margin = {t:50,r:50,b:100,l:75},
    width = $('.canvas').width() - margin.l - margin.r,
    height = $('.canvas').height() - margin.t - margin.b;

var svg = d3.select('.canvas')
    .append('svg')
    .attr('width', width + margin.l + margin.r)
    .attr('height', height + margin.t + margin.b)
    .append('g')
    .attr('transform','translate('+margin.l+','+margin.t+')');

var scales = {};
    scales.x = d3.scale.log().range([0,width]);
    scales.y = d3.scale.linear().range([height,0]);

var yVariable = "CO2 emissions (kt)",
    y0 = 1990,
    y1 = 2000;

var metaDataMap = d3.map();
var colorScale = d3.scale.ordinal()
    .domain(['Europe & Central Asia','South Asia','Middle East & North Africa','North Americas','Sub-Saharan Africa','East Asia & Pacific','Latin America & Caribbean'])
    .range(['rgb(220,92,92)','rgb(220,92,180)','rgb(92,220,180)','rgb(92,180,220)','rgb(180,220,92)','rgb(120,92,220)','rgb(92,120,220)']);

//TODO: create a layout function for a treemap
var treemap = d3.layout.treemap()
    .children(function(d){
        return d.values;
    })
    .value(function(d){
        return d.data.get(1990);
    })
    .size([width,height])

queue()
    .defer(d3.csv, "data/00fe9052-8118-4003-b5c3-ce49dd36eac1_Data.csv",parse)
    .defer(d3.csv, "data/metadata.csv", parseMetaData)
    .await(dataLoaded);

function dataLoaded(err, rows, metadata){

    rows.forEach(function(row){
        row.region1 = metaDataMap.get(row.key);
    });
    var nest = d3.nest()
        .key(function(d){
            return d.region1 ;
        });
    var nestedData = nest.entries(rows);
    console.log(nestedData);

    var root = {
        key:"regions",
        values: nestedData
    };

    draw(root);
}

function draw(root){

var nodes = svg.selectAll('.node')
        .data( treemap(root),function(d){return d.key;})
        .classed('leaf',function(d){
        return !(d.children);
    });

    var nodesEnter =nodes
        .enter()
        .append('g')
        .attr('class','node')
        .attr('transform',function(d){
            return "translate("+d.x+','+d.y+')';
        })
        ;
    nodesEnter
        .append('rect')
        .attr('width',function(d){return d.dx;})
        .attr('height',function(d){return d.dy;})
        .style('fill',function(d){
            var continent = metaDataMap.get(d.key);
            return colorScale(continent);
        })
        .style('stroke','white')
        .style('stroke-width','.5px')

    nodesEnter
        .each(function(d){
            if(d.dx > 50 && d.dy >20){
                var textlabel = d3.select(this)
                    .append('text');
                textlabel.text(function(d){
                        return d.key;
                    })
                    .attr("font-family", "serif")
                    .attr('dx', d.dx/2)
                    .attr('dy', d.dy/2)
                    .attr('text-anchor','middle');
            }
        });
}

function parse(d){
    var newRow = {
        key: d["Country Name"],
        series: d["Series Name"],
        data:d3.map()
    };
    for(var i=1990; i<=2013; i++){
        var heading = i + " [YR" + i + "]";
        newRow.data.set(
            i,
            (d[heading]=="..")?0:+d[heading]
        );
    }

    return newRow;
}

function parseMetaData(d){
    var countryName = d["Table Name"];
    var region = d["Region"];
    metaDataMap.set(countryName, region);
}