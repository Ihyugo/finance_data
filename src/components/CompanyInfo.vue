<template>
  <div v-if="info">
    <h1>{{ info.longName }}</h1>
<!-- グラフ描画用のdivを追加 -->
    <div id="container" style="width: 100%; height: 400px;"></div>

      <table>
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(value, key) in info" :key="key">
          <!-- formatValue(key) -->
          <td v-html="formatValue(key)"></td>
          <td>{{ value }}</td>
        </tr>
      </tbody>
    </table>

    <!-- <RecursiveViewer :data="info" /> -->

  </div>
  <div v-else>
    <p>{{ message }}</p>
  </div>
</template>

<script>
import axios from 'axios'
import { infoData } from './array/info_data';
import { createChart } from 'lightweight-charts'
import { CandlestickSeries } from 'lightweight-charts';

export default {
  name: "CompanyInfo",
  props: {
    msg: String,
  },
  data() {
    return {
      info: null,
      history:[]
    };
  },
  created() {
    this.getStockInfo();
  },

  methods: {
    async getStockInfo() {
      try {
        const res = await axios.get('https://fastapi-service-658417983475.us-central1.run.app/stock/7203.T');
        // const res = await axios.get('http://127.0.0.1:8000/stock/7203.T');
        
        this.info = res.data.info;
        this.history = res.data.history;
        // infoがセットされてDOMが再描画された後にグラフを描画
      this.$nextTick(() => {
        this.createChart();
      });
      } catch (e) {
        this.message = 'エラー: ' + e;
      }
    },
    formatValue(key) {
      let ja_hash = infoData();
      let ja_key = ja_hash[key] || key;
      return(
        `<strong>${ja_key}:</strong> `
      )
    },
    createChart(){
      const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };
    const chart = createChart(document.getElementById('container'), chartOptions);
  const candlestickSeries = chart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });

  // const data = [{ open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 }, { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 }, { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 }, { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 }, { open: 9.51, high: 10.46, low: 9.10, close: 10.17, time: 1642773476 }, { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 }, { open: 10.47, high: 11.39, low: 10.40, close: 10.81, time: 1642946276 }, { open: 10.81, high: 11.60, low: 10.30, close: 10.75, time: 1643032676 }, { open: 10.75, high: 11.60, low: 10.49, close: 10.93, time: 1643119076 }, { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 }];
console.log(this.history);
  candlestickSeries.setData(this.history);

  chart.timeScale().fitContent();
    }
  },
};




</script>

