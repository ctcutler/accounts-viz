import * as R from 'ramda';
import moment from "moment";
import Chart from 'chart.js';
import React, { Component } from 'react';
import { dataSeries } from './chart-util.js';
import { ORANGE } from './colors.js';

class AssetBreakdown extends Component {

  componentDidMount() {
    const start = new Date("2014/01/01");
    const end = moment().startOf("month").toDate();
    const granularity = "month";
    const sum = R.compose(
      R.sum,
      pattern => dataSeries({granularity, pattern, start, end, accumulate: false, negate: false })
    );
    const savingsAccounts = sum(/^Assets:Ally Bank:Money Market$/)
      + sum(/^Assets:Ally Bank:Online Savings$/)
      + sum(/^Assets:Kennebunk:Checking$/);
    const cdLadder = sum(/^Assets:Ally Bank:CD/);
    const homeEquity = sum(/^Assets:80 Madbury Road$/)
      + sum(/^Liabilities:Mortgages:Institution For Savings$/);
    const retirementAccounts = sum(/^Assets:Fidelity:401\(k\)$/)
      + sum(/^Assets:Vanguard/)
      + sum(/^Assets:TIAA CREF:403\(b\)$/);

    const data = {
      labels: ["Savings Accounts", "CD Ladder", "Home Equity", "Retirement Accounts"],
      datasets: [{
        data: [savingsAccounts, cdLadder, homeEquity, retirementAccounts],
        backgroundColor: ORANGE,
        borderColor: ORANGE,
      }]
    };
    const options = {
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    };
    const ctx = document.getElementById("assetBreakdownChart").getContext("2d");
    Chart.defaults.global.defaultFontFamily = "'Roboto Slab', serif";
    new Chart(ctx, { type: 'bar', data, options });
  }


  render() {
    return (
      <canvas id="assetBreakdownChart"></canvas>
    );
  }
}

export default AssetBreakdown;
