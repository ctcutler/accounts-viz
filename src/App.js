import Chart from 'chart.js';
import React, { Component } from 'react';
import { dateLabels, dataSeries, sumSeries } from './chart-util.js';

class App extends Component {
  componentDidMount() {
    const start = new Date("2014/01/01");
    const end = new Date("2018/09/01");
    const granularity = "month";
    const labels = dateLabels(granularity, start, end);
    const assetSeries = dataSeries(granularity, /^Assets/, start, end, true);
    const liabilitySeries = dataSeries(granularity, /^Liabilities/, start, end, true);
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
    const ctx = document.getElementById("myChart").getContext('2d');
    new Chart(ctx, { type: 'line', data, options });
  }
  render() {
    return (
      <div>
        <canvas id="myChart"></canvas>
      </div>
    );
  }
}

export default App;
