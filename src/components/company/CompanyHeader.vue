<template>
  <div class="company-header">
    <div class="company-title">
      <h1>{{ companyName }}</h1>
      <div class="company-meta">
        <span class="ticker">{{ ticker }}</span>
        <span class="sector">{{ sector }}</span>
      </div>
    </div>
    <div class="company-summary">
      <div class="summary-card">
        <div class="summary-item">
          <span class="label">現在価格</span>
          <span class="value price">{{ formatPrice(currentPrice) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">前日比</span>
          <span
            class="value"
            :class="getChangeClass(changePercent)"
          >
            {{ formatChange(changePercent) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CompanyHeader",
  props: {
    companyName: {
      type: String,
      required: true,
    },
    ticker: {
      type: String,
      default: "",
    },
    sector: {
      type: String,
      default: "",
    },
    currentPrice: {
      type: Number,
      default: null,
    },
    changePercent: {
      type: Number,
      default: null,
    },
  },
  methods: {
    formatPrice(price) {
      if (price === null || price === undefined) return "N/A";
      return `¥${price.toLocaleString()}`;
    },
    formatChange(percent) {
      if (percent === null || percent === undefined) return "N/A";
      const change = parseFloat(percent);
      if (change > 0) {
        return `+${change.toFixed(2)}%`;
      } else {
        return `${change.toFixed(2)}%`;
      }
    },
    getChangeClass(percent) {
      const change = parseFloat(percent);
      if (change > 0) {
        return "positive";
      } else if (change < 0) {
        return "negative";
      } else {
        return "";
      }
    },
  },
};
</script>

<style scoped>
.company-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.company-title h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.company-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.ticker {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1.1rem;
}

.sector {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.company-summary {
  text-align: right;
}

.summary-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.summary-item {
  margin-bottom: 0.5rem;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item .label {
  display: block;
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 0.25rem;
}

.summary-item .value {
  font-size: 1.5rem;
  font-weight: 700;
}

.summary-item .value.price {
  font-size: 2rem;
}

.summary-item .value.positive {
  color: #4ade80;
}

.summary-item .value.negative {
  color: #f87171;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .company-header {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .company-title h1 {
    font-size: 2rem;
  }

  .company-summary {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .company-title h1 {
    font-size: 1.75rem;
  }
}
</style>
