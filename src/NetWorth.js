import Chart from 'chart.js';
import moment from "moment";
import React, { Component } from 'react';
import { dateLabels, dataSeries, sumSeries, trendSeries } from './chart-util.js';

class NetWorth extends Component {

  componentDidMount() {
    const start = new Date("2014/01/01");
    const end = new Date("2018/09/01");
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
      },
      {
        data: netWorthTrendSeries,
        label: "Net Worth Trend"
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
