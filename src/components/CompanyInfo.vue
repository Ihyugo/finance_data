<template>
  <div v-if="info">
    <h1>{{ info.longName }}</h1>
    <!-- グラフ描画用のdivを追加 -->
    <!-- <div id="container" style="width: 100%; height: 400px" /> -->
    <StockChart :stock-data="history" />

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
          <td v-html="formatValue(key)" />
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
import axios from "axios";
import { infoData } from "./array/info_data";
import StockChart from "./StockChart.vue";

export default {
  name: "CompanyInfo",
  components: {
    StockChart,
  },
  props: {
    code: String,
  },
  data() {
    return {
      info: null,
      history: [],
      stockdata: [],
    };
  },
  created() {
    this.getStockInfo();
  },
  methods: {
    async getStockInfo() {
      try {
        console.log("Fetching stock info for code:", this.code);
        const res = await axios.get(
          "https://fastapi-service-658417983475.us-central1.run.app/stock/" +
            this.code
        );
        // ローカルのFastAPIサーバーを使用する場合
        // const res = await axios.get("http://127.0.0.1:8000/stock/" + this.code);

        this.info = res.data.info;
        this.history = res.data.history;
      } catch (e) {
        this.message = "エラー: " + e;
      }
    },
    formatValue(key) {
      let ja_hash = infoData();
      let ja_key = ja_hash[key] || key;
      return `<strong>${ja_key}:</strong> `;
    },
  },
};
</script>
