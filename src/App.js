import Chart from 'chart.js';
import * as R from 'ramda';
import parsed from './parsed';
import {
  filterByAccount, balance, dataPoints, addEmptyPoints, accumulateValues, hydrate
} from './compute';
import React, { Component } from 'react';

class App extends Component {
  componentDidMount() {
    const { prices, transactions } = hydrate(parsed);
    const granularity = 'month';
    const pattern = /^Equity/; // FIXME: equity expenses income
    const dataPairs = R.compose(
      accumulateValues,
      addEmptyPoints(granularity, new Date("2014/01/01"), new Date("2018/09/01")),
      dataPoints(pattern, granularity),
      balance(prices),
      filterByAccount(pattern)
    )(transactions);

    /* Input: format function, index, list of data points
     * Output: just the item at index of each data point, after format function has been applied
     */
    const series = (format, idx, pairs) => R.compose(R.map(format), R.pluck(idx))(pairs);
    const formatDate = R.invoker(1, "toLocaleDateString")("en-US");
    const formatDecimal = R.invoker(0, 'valueOf');
    const labels = series(formatDate, 0, dataPairs);
    const assetSeries = series(formatDecimal, 1, dataPairs);
    const datasets = [
      {
        data: assetSeries,
        label: "Assets"
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
