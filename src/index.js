import "babel/polyfill";
import d3 from 'd3';
import csv from './csv.js';
import _ from 'lodash';

class Chart {

  constructor({data, id}) {
    this.data = data;
    this.container = d3.select(id);
    d3.select(window).on('resize', _.debounce(::this.draw, 50));
  }

  draw() {

    let percent = d3.format('%');

    let {data} = this;

    let bb = this.container.node().getBoundingClientRect();

    let margin = { top: 50, right: 30, bottom: 10, left: 30 },
        width = bb.width - margin.left - margin.right,
        height = bb.height - margin.top - margin.bottom;

    let svg = this.container.html('').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    let absMax = d3.max(data, x => Math.abs(x.p))

    let x = d3.scale.linear()
      .range([0, width])
      .domain([-1, 1]);

    let xAxis = d3.svg.axis()
      .scale(x)
      .orient("top")
      .tickFormat(percent);

    let gridAxis = d3.svg.axis()
      .scale(x)
      .orient("top")
      .innerTickSize(-height)
      .tickFormat(percent);

    let dy = height/data.length;

    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)

    svg.append("g")
        .attr("class", "x grid")
        .call(gridAxis)

    let row = svg.append('g')
        .selectAll('g')
        .data(data)
      .enter().append('g')
        .attr('transform', (d,i) => `translate(0,${i*dy})`);

    row.append('line')
      .attr({
        x1 : width/2,
        x2 : d => x(d.p),
        y1 : dy/2,
        y2 : dy/2
      })
      .style({
        stroke: d => d.p < 0 ? '#d62728' : '#2ca02c'
      })

    row.append('circle')
      .attr({
        cx : d => x(d.p),
        cy : dy/2,
        r: 4
      })

    row.append('text')
      .text(d => d.subject)
      .attr({
        x : function(d) {
          let {width} = this.getBBox();
          let xval = x(d.p);
          return d.p < 0 ? (xval - width - 10) : (xval + 10);
        },
        y : function(d) {
          let {height} = this.getBBox();
          return dy/2 + height/4;
        }
      })

    let midline = svg.append('line')
      .attr({
        x1 : width/2,
        x2 : width/2,
        y1 : 0,
        y2 : height
      })



    svg.append('g')
      .append('text')
      .text('Less Likely')
      .style('fill', '#d62728')
      .attr('x', function() {
        return width/4 - this.getBBox().width/2;
      })
      .attr('y', -30)

    svg.append('g')
      .append('text')
      .text('More Likely')
      .style('fill', '#2ca02c')
      .attr('x', function() {
        return width*(3/4) - this.getBBox().width/2;
      })
      .attr('y', -30)

  }

}

async function render() {

  let data = (await csv('./relative_percent.csv')).map(x => {
    x.p = Number(x.relative_percentage);
    return x;
  }).sort((x,y) => (x.p < y.p) - (x.p > y.p));

  let chart = new Chart({data, id: '#chart'});

  chart.draw();
}

render();