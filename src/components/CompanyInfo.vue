<template>
  <div v-if="info">
    <h1>{{ info.longName }}</h1>

    <li v-for="(value, key) in info" :key="key">
      <span v-html="formatValue(key, value)"></span>
      </li>

    <RecursiveViewer :data="info" />

  </div>
  <div v-else>
    <p>{{ message }}</p>
  </div>
</template>

<script>
import axios from 'axios'
import { infoData } from './array/info_data';


export default {
  name: "CompanyInfo",
  props: {
    msg: String,
  },
  data() {
    return {
      info: null,
    };
  },
  created() {
    this.getStockInfo();
  },
  methods: {
    async getStockInfo() {
      try {
        const res = await axios.get('https://fastapi-service-658417983475.us-central1.run.app/stock/7203.T');
        this.info = res.data.info;
      } catch (e) {
        this.message = 'エラー: ' + e;
      }
    },
    formatValue(key, value) {
      let ja_hash = infoData();
      let ja_key = ja_hash[key] || key;
      return(
        `<strong>${ja_key}:</strong> ${value}`
      )

      
    },
  },
};




</script>

