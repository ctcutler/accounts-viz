import Chart from 'chart.js';
import React, { Component } from 'react';
import { dateLabels, dataSeries, sumSeries } from './chart-util.js';

class NetWorth extends Component {

  componentDidMount() {
    const start = new Date("2014/01/01");
    const end = new Date("2018/09/01");
    const granularity = "month";
    const labels = dateLabels(granularity, start, end);
    const assetSeries = dataSeries(
      { granularity, pattern: /^Assets/, start, end, accumulate: true, negate: false }
    );
    const liabilitySeries = dataSeries(
      { granularity, pattern: /^Liabilities/, start, end, accumulate: true, negate: false }
    );
    const netWorthSeries = sumSeries(assetSeries, liabilitySeries);
    const datasets = [
      {
        data: assetSeries,
        label: "Assets"
      },
      {
        data: liabilitySeries,
        label: "Liabilities"
      },
      {
        data: netWorthSeries,
        label: "Net Worth"
      }
    ];
    const data = { labels, datasets };
    const options = {
      elements: {
        line: {
          tension: 0, // disables bezier curves
        }
      }
    };
    const ctx = document.getElementById("netWorthChart").getContext('2d');
    new Chart(ctx, { type: 'line', data, options });
  }


  render() {
    return (
      <canvas id="netWorthChart"></canvas>
    );
  }
}

export default NetWorth;
