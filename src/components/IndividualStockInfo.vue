<template>
  <div v-if="info">
    <h1>{{ info.longName }}</h1>
    <p><strong>所在地:</strong> {{ info.address1 }}, {{ info.city }}, {{ info.country }}</p>
    <p><strong>郵便番号:</strong> {{ info.zip }}</p>
    <p><strong>電話番号:</strong> {{ info.phone }}</p>
    <p><strong>Webサイト:</strong> <a :href="info.website" target="_blank">{{ info.website }}</a></p>
    <p><strong>業種:</strong> {{ info.industry }}（{{ info.sector }}）</p>
    <p><strong>従業員数:</strong> {{ info.fullTimeEmployees.toLocaleString() }}人</p>
    <p><strong>概要:</strong> {{ info.longBusinessSummary }}</p>

    <bar></bar>
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
  name: "IndividualStockInfo",
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

