import Chart from 'chart.js';
import React, { Component } from 'react';
import { dateLabels, dataSeries, sumSeries } from './chart-util.js';

class App extends Component {
  componentDidMount() {
    const start = new Date("2014/01/01");
    const end = new Date("2018/09/01");
    const granularity = "month";
    const labels = dateLabels(granularity, start, end);
    /*
    const assetSeries = dataSeries(
      { granularity, pattern: /^Assets/, start, end, accumulate: true, negate: false }
    );
    const liabilitySeries = dataSeries(
      { granularity, pattern: /^Liabilities/, start, end, accumulate: true, negate: false }
    );
    const netWorthSeries = sumSeries(assetSeries, liabilitySeries);
    // FIXME: curve fit project into future
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
    */
    const expenseSeries = dataSeries(
      { granularity, pattern: /^Expenses/, start, end, accumulate: false, negate: true }
    );
    const incomeSeries = dataSeries(
      { granularity, pattern: /^Income/, start, end, accumulate: false, negate: true }
    );
    const datasets = [
      {
        data: expenseSeries,
        label: "Expenses"
      },
      {
        data: incomeSeries,
        label: "Income"
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
