import React, { Component } from 'react';
import NetWorth from './NetWorth';
import SavingRate from './SavingRate';
import AssetBreakdown from './AssetBreakdown';
import './App.css';

const NET_WORTH = 'net worth';
const SAVING_RATE = 'saving rate';
const ASSET_BREAKDOWN = 'asset breakdown';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { visible: NET_WORTH };
  }

  handleMenuClick(e, view) {
    this.setState({ visible: view });
  }

  render() {
    let chart = null;
    if (this.state.visible === NET_WORTH) {
      chart = <NetWorth/>;
    } else if (this.state.visible === SAVING_RATE) {
      chart = <SavingRate/>;
    } else if (this.state.visible === ASSET_BREAKDOWN) {
      chart = <AssetBreakdown/>;
    } else {
      console.log(`unknown visible chart ${this.state.visible}`);
    }

    return (
      <div className="container">
        <div className="menu">
           <div className={this.state.visible === NET_WORTH ? 'selected menuItem' : 'menuItem'}
                onClick={e => this.handleMenuClick(e, NET_WORTH)}>Net Worth</div>
           <div className={this.state.visible === SAVING_RATE ? 'selected menuItem' : 'menuItem'}
                onClick={e => this.handleMenuClick(e, SAVING_RATE)}>Saving Rate</div>
           <div className={this.state.visible === ASSET_BREAKDOWN ? 'selected menuItem' : 'menuItem'}
                onClick={e => this.handleMenuClick(e, ASSET_BREAKDOWN)}>Asset Breakdown</div>
        </div>
        <div className="main">
          {chart}
        </div>
      </div>
    );
  }
}
export default App;
