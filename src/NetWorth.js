import Chart from 'chart.js';
import moment from "moment";
import React, { Component } from 'react';
import { dateLabels, dataSeries, sumSeries, trendSeries, dateRange } from './chart-util.js';
import { LIGHT_GREEN, BLUE, LIGHT_RED, ORANGE } from './colors.js';

class NetWorth extends Component {

  componentDidMount() {
    const [start, end] = dateRange();
    const projection = 12;
    const granularity = "month";
    const future = moment(end).add(projection, granularity).toDate();
    const labels = dateLabels(granularity, start, future);
    const assetSeries = dataSeries(
      { granularity, pattern: /^Assets/, start, end, accumulate: true, negate: false }
    );
    const liabilitySeries = dataSeries(
      { granularity, pattern: /^Liabilities/, start, end, accumulate: true, negate: false }
    );
    const netWorthSeries = sumSeries(assetSeries, liabilitySeries);
    const netWorthTrendSeries = trendSeries(netWorthSeries, netWorthSeries.length + projection);
    const datasets = [
      {
        data: netWorthTrendSeries,
        borderColor: BLUE,
        backgroundColor: BLUE,
        fill: false,
        pointRadius: 0,
        pointHitRadius: 10,
        label: "Net Worth Trend"
      },
      {
        data: netWorthSeries,
        borderColor: ORANGE,
        backgroundColor: ORANGE,
        fill: false,
        pointRadius: 0,
        pointHitRadius: 10,
        label: "Net Worth"
      },
      {
        data: assetSeries,
        borderColor: LIGHT_GREEN,
        backgroundColor: LIGHT_GREEN,
        pointRadius: 0,
        pointHitRadius: 10,
        label: "Assets"
      },
      {
        data: liabilitySeries,
        borderColor: LIGHT_RED,
        backgroundColor: LIGHT_RED,
        pointRadius: 0,
        pointHitRadius: 10,
        label: "Liabilities"
      },
    ];
    const data = { labels, datasets };
    const options = {
      elements: {
        line: {
          tension: 0, // disables bezier curves
        }
      }
    };
    const ctx = document.getElementById("netWorthChart").getContext("2d");
    Chart.defaults.global.defaultFontFamily = "'Roboto Slab', serif";
    new Chart(ctx, { type: 'line', data, options });
  }


  render() {
    return (
      <canvas id="netWorthChart"></canvas>
    );
  }
}

export default NetWorth;
