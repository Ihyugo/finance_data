<template>
  <div class="tab-panel">
    <div class="info-grid">
      <InfoCard
        title="基本情報"
        :items="basicInfoItems"
      />
      <InfoCard
        title="市場情報"
        :items="marketInfoItems"
      />
    </div>
  </div>
</template>

<script>
import InfoCard from "../../common/InfoCard.vue";

export default {
  name: "OverviewTab",
  components: {
    InfoCard,
  },
  props: {
    companyInfo: {
      type: Object,
      required: true,
    },
  },
  computed: {
    basicInfoItems() {
      return [
        {
          label: "企業名",
          value: this.companyInfo.longName || "N/A",
        },
        {
          label: "業界",
          value: this.companyInfo.sector || "N/A",
        },
        {
          label: "従業員数",
          value: this.formatNumber(this.companyInfo.fullTimeEmployees),
        },
        {
          label: "設立年",
          value: this.formatEstablishmentYear(this.companyInfo.firstTradeDateEpochUtc),
        },
      ];
    },
    marketInfoItems() {
      return [
        {
          label: "時価総額",
          value: this.formatMarketCap(this.companyInfo.marketCap),
        },
        {
          label: "取引量",
          value: this.formatVolume(this.companyInfo.volume),
        },
        {
          label: "52週最高",
          value: this.formatPrice(this.companyInfo.fiftyTwoWeekHigh),
        },
        {
          label: "52週最低",
          value: this.formatPrice(this.companyInfo.fiftyTwoWeekLow),
        },
      ];
    },
  },
  methods: {
    formatNumber(num) {
      if (num === null || num === undefined) return "N/A";
      return num.toLocaleString();
    },
    formatPrice(price) {
      if (price === null || price === undefined) return "N/A";
      return `¥${price.toLocaleString()}`;
    },
    formatMarketCap(marketCap) {
      if (marketCap === null || marketCap === undefined) return "N/A";
      if (marketCap >= 1000000000000) {
        return `¥${(marketCap / 1000000000000).toFixed(1)}T`;
      } else if (marketCap >= 1000000000) {
        return `¥${(marketCap / 1000000000).toFixed(0)}B`;
      } else if (marketCap >= 1000000) {
        return `¥${(marketCap / 1000000).toFixed(0)}M`;
      } else {
        return `¥${marketCap.toLocaleString()}`;
      }
    },
    formatVolume(volume) {
      if (volume === null || volume === undefined) return "N/A";
      return volume.toLocaleString();
    },
    formatEstablishmentYear(epochMs) {
      if (!epochMs) return "N/A";
      return new Date(epochMs * 1000).getFullYear();
    },
  },
};
</script>

<style scoped>
.tab-panel {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
