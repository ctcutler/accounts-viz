import Chart from 'chart.js';
import React, { Component } from 'react';
import { dateLabels, dataSeries, sumSeries, trendSeries } from './chart-util.js';

class SavingRate extends Component {
  componentDidMount() {
    const start = new Date("2014/11/01");
    const end = new Date("2018/02/01");
    const granularity = "month";
    const labels = dateLabels(granularity, start, end);

    /* Ideas:
     * - curve fit (linear regression?  something else?)
     * - average
     *   - average of everything in the 95th percentile
     *   - or standard deviation
     * - anova?
     * - median
     * - average or median per year
     * - average of the N surrounding data points
     */
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
        data: expenseSeries,
        label: "Expenses"
      },
      {
        data: incomeSeries,
        label: "Income"
      },
      {
        data: savingRateSeries,
        label: "Saving Rate"
      },
      {
        data: savingTrendSeries,
        label: "Saving Trend"
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
