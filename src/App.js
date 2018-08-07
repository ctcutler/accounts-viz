import Chart from 'chart.js';
import * as R from 'ramda';
import parsed from './parsed';
import {
  filterByAccount, filterByTime, toDollars, balance, dataPoints, addEmptyPoints,
  accumulateValues, hydrate
} from './compute';
import React, { Component } from 'react';

class App extends Component {
  componentDidMount() {
    const ctx = document.getElementById("myChart").getContext('2d');
    const { prices, transactions } = hydrate(parsed);
    const dataPairs = R.compose(
      //filterByTime(new Date("2017/01/01"), new Date("2017/01/31")),
      accumulateValues,
      //addEmptyPoints('day', new Date("2017/01/01"), new Date("2017/01/31")),
      dataPoints('year'),
      balance,
      toDollars(prices),
      filterByAccount(/^Assets/)
    )(transactions);
    const labels = R.compose(R.map(x => x.toString()), R.pluck(0))(dataPairs);
    const data = R.compose(R.map(x => x.valueOf()), R.pluck(1))(dataPairs);
    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{ data }]
        },
    });
  }
  render() {
    return (
      <div>
        <canvas id="myChart" width="400" height="400"></canvas>
      </div>
    );
  }
}

export default App;
