import Chart from 'chart.js';
import React, { Component } from 'react';
import { dateLabels, dataSeries, sumSeries, trendSeries } from './chart-util.js';

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
