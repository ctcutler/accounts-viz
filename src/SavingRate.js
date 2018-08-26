import Chart from 'chart.js';
import React, { Component } from 'react';
import { dateLabels, dataSeries, sumSeries, trendSeries, dateRange } from './chart-util.js';
import { LIGHT_GREEN, BLUE, LIGHT_RED, ORANGE } from './colors.js';

class SavingRate extends Component {
  componentDidMount() {
    const [start, end] = dateRange();
    const granularity = "month";
    const labels = dateLabels(granularity, start, end);
    const expenseSeries = dataSeries(
      { granularity, pattern: /^Expenses/, start, end, accumulate: false, negate: true }
    );
    const incomeSeries = dataSeries(
      { granularity, pattern: /^Income/, start, end, accumulate: false, negate: true }
    );
    const savingRateSeries = sumSeries(expenseSeries, incomeSeries);
    const savingTrendSeries = trendSeries(savingRateSeries);
    const datasets = [
      {
        data: savingRateSeries,
        borderColor: ORANGE,
        backgroundColor: ORANGE,
        fill: false,
        pointRadius: 0,
        pointHitRadius: 10,
        label: "Saving Rate"
      },
      {
        data: savingTrendSeries,
        borderColor: BLUE,
        backgroundColor: BLUE,
        fill: false,
        pointRadius: 0,
        pointHitRadius: 10,
        label: "Saving Trend"
      },
      {
        data: expenseSeries,
        borderColor: LIGHT_RED,
        backgroundColor: LIGHT_RED,
        pointRadius: 0,
        pointHitRadius: 10,
        label: "Expenses"
      },
      {
        data: incomeSeries,
        borderColor: LIGHT_GREEN,
        backgroundColor: LIGHT_GREEN,
        pointRadius: 0,
        pointHitRadius: 10,
        label: "Income"
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
    const ctx = document.getElementById("savingRateChart").getContext('2d');
    Chart.defaults.global.defaultFontFamily = "'Roboto Slab', serif";
    new Chart(ctx, { type: 'line', data, options });
  }


  render() {
    return (
      <canvas id="savingRateChart"></canvas>
    );
  }
}

export default SavingRate;
