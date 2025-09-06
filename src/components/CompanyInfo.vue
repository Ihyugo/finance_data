<template>
  <div
    v-if="info"
    class="company-info-container"
  >
    <!-- 企業ヘッダー -->
    <CompanyHeader
      :company-name="info.longName"
      :ticker="info.symbol"
      :sector="info.sector"
      :current-price="info.regularMarketPrice"
      :change-percent="info.regularMarketChangePercent"
    />

    <!-- タブナビゲーション -->
    <TabNavigation
      :tabs="tabs"
      :active-tab="activeTab"
      @tab-change="activeTab = $event"
    />

    <!-- タブコンテンツ -->
    <div class="tab-content">
      <!-- 基本情報タブ -->
      <OverviewTab
        v-if="activeTab === 'overview'"
        :company-info="info"
      />

      <!-- 財務指標タブ -->
      <div
        v-if="activeTab === 'financials'"
        class="tab-panel"
      >
        <div class="info-grid">
          <InfoCard
            title="収益性指標"
            :items="profitabilityItems"
          />
          <InfoCard
            title="バリュエーション指標"
            :items="valuationItems"
          />
        </div>
      </div>

      <!-- 企業行動タブ -->
      <div
        v-if="activeTab === 'corporate'"
        class="tab-panel"
      >
        <div class="info-grid">
          <div class="info-card">
            <h3>配当情報</h3>
            <div
              class="info-content"
              v-text="formatDividendInfo(info.dividendHistory || [])"
            />
          </div>
          <div class="info-card">
            <h3>その他の企業行動</h3>
            <div class="info-content">
              <div
                v-for="(value, key) in getCorporateActions()"
                :key="key"
                class="info-item"
              >
                <span class="label">{{ formatLabel(key) }}</span>
                <span
                  class="value"
                  v-text="formatDetailValue(value)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 役員情報タブ -->
      <div
        v-if="activeTab === 'executives'"
        class="tab-panel"
      >
        <div class="info-card full-width">
          <h3>役員一覧</h3>
          <div class="executives-grid">
            <div
              v-for="(exec, index) in info.companyOfficers || []"
              :key="index"
              class="executive-card"
            >
              <div class="executive-header">
                <h4>{{ exec.name || "N/A" }}</h4>
                <span class="executive-title">{{ exec.title || "N/A" }}</span>
              </div>
              <div class="executive-details">
                <div
                  v-if="exec.age"
                  class="executive-detail"
                >
                  <span class="label">年齢:</span>
                  <span class="value">{{ exec.age }}歳</span>
                </div>
                <div
                  v-if="exec.yearBorn"
                  class="executive-detail"
                >
                  <span class="label">生年:</span>
                  <span class="value">{{ exec.yearBorn }}年</span>
                </div>
                <div
                  v-if="exec.totalPay"
                  class="executive-detail"
                >
                  <span class="label">報酬:</span>
                  <span class="value">¥{{ (exec.totalPay / 10000).toFixed(0) }}万円</span>
                </div>
                <div
                  v-if="exec.fiscalYear"
                  class="executive-detail"
                >
                  <span class="label">会計年度:</span>
                  <span class="value">{{ exec.fiscalYear }}年</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- チャートタブ -->
      <div
        v-if="activeTab === 'chart'"
        class="tab-panel"
      >
        <div class="chart-container">
          <StockChart :stock-data="history" />
        </div>
      </div>

      <!-- 詳細情報タブ -->
      <div
        v-if="activeTab === 'details'"
        class="tab-panel"
      >
        <div class="info-card full-width">
          <h3>全データ</h3>
          <div class="data-table">
            <div class="table-header">
              <span class="header-cell">項目</span>
              <span class="header-cell">値</span>
            </div>
            <div class="table-body">
              <div
                v-for="(value, key) in info"
                :key="key"
                class="table-row"
              >
                <span class="cell label">{{ formatLabel(key) }}</span>
                <span
                  class="cell value"
                  v-text="formatDetailValue(value)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="loading-container"
  >
    <div class="loading-spinner" />
    <p>{{ message || "企業情報を読み込み中..." }}</p>
  </div>
</template>

<script>
import apiService from "@/services/apiService.js";
import { infoData } from "./array/info_data";
import StockChart from "./StockChart.vue";
import CompanyHeader from "./company/CompanyHeader.vue";
import TabNavigation from "./common/TabNavigation.vue";
import OverviewTab from "./company/tabs/OverviewTab.vue";
import InfoCard from "./common/InfoCard.vue";
import "@/assets/styles/common.css";

export default {
  name: "CompanyInfo",
  components: {
    StockChart,
    CompanyHeader,
    TabNavigation,
    OverviewTab,
    InfoCard,
  },
  props: {
    code: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      info: null,
      history: [],
      stockdata: [],
      activeTab: "overview", // デフォルトで基本情報タブを表示
      tabs: [
        { id: "overview", label: "基本情報", icon: "fas fa-info-circle" },
        { id: "financials", label: "財務指標", icon: "fas fa-chart-bar" },
        { id: "corporate", label: "企業行動", icon: "fas fa-briefcase" },
        { id: "executives", label: "役員情報", icon: "fas fa-users" },
        { id: "chart", label: "チャート", icon: "fas fa-chart-line" },
        { id: "details", label: "詳細情報", icon: "fas fa-database" },
      ],
    };
  },
  computed: {
    // 収益性指標のアイテム
    profitabilityItems() {
      return [
        {
          label: "ROE",
          value: this.formatPercentage(this.info?.returnOnEquity),
        },
        {
          label: "ROA",
          value: this.formatPercentage(this.info?.returnOnAssets),
        },
        {
          label: "営業利益率",
          value: this.formatPercentage(this.info?.operatingMargins),
        },
        {
          label: "純利益率",
          value: this.formatPercentage(this.info?.profitMargins),
        },
      ];
    },
    // バリュエーション指標のアイテム
    valuationItems() {
      return [
        {
          label: "P/E比率",
          value: this.formatNumber(this.info?.trailingPE),
        },
        {
          label: "P/B比率",
          value: this.formatNumber(this.info?.priceToBook),
        },
        {
          label: "PEG比率",
          value: this.formatNumber(this.info?.pegRatio),
        },
        {
          label: "配当利回り",
          value: this.formatPercentage(this.info?.dividendYield),
        },
      ];
    },
    // 配当情報のアイテム
    dividendItems() {
      const dividendHistory = this.info?.dividendHistory || [];
      if (dividendHistory.length === 0) {
        return [{ label: "配当情報", value: "なし" }];
      }

      return dividendHistory.map((dividend, index) => ({
        label: `配当${index + 1}`,
        value: this.formatDividendItem(dividend),
      }));
    },
    // 企業行動のアイテム
    corporateActionItems() {
      const actions = this.getCorporateActions();
      if (Object.keys(actions).length === 0) {
        return [{ label: "企業行動", value: "なし" }];
      }

      return Object.entries(actions).map(([key, value]) => ({
        label: this.formatLabel(key),
        value: this.formatDetailValue(value),
      }));
    },
  },
  created() {
    this.getStockInfo();
  },
  methods: {
    async getStockInfo() {
      try {
        console.log("Fetching stock info for code:", this.code);
        const data = await apiService.getStockInfo(this.code);

        this.info = data.info;
        this.history = data.history;
      } catch (e) {
        this.message = "エラー: " + e;
      }
    },
    formatValue(key) {
      let ja_hash = infoData();
      let ja_key = ja_hash[key] || key;
      return `<strong>${ja_key}:</strong> `;
    },
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
    formatNumber(num) {
      if (num === null || num === undefined) return "N/A";
      return num.toLocaleString();
    },
    formatMarketCap(marketCap) {
      if (marketCap === null || marketCap === undefined) return "N/A";
      if (marketCap >= 1000000000000) {
        // 1兆円以上
        return `¥${(marketCap / 1000000000000).toFixed(1)}T`;
      } else if (marketCap >= 1000000000) {
        // 10億円以上
        return `¥${(marketCap / 1000000000).toFixed(0)}B`;
      } else if (marketCap >= 1000000) {
        // 100万円以上
        return `¥${(marketCap / 1000000).toFixed(0)}M`;
      } else {
        return `¥${marketCap.toLocaleString()}`;
      }
    },
    formatVolume(volume) {
      if (volume === null || volume === undefined) return "N/A";
      return volume.toLocaleString();
    },
    formatPercentage(percent) {
      if (percent === null || percent === undefined) return "N/A";
      return `${percent.toFixed(2)}%`;
    },
    formatLabel(key) {
      let ja_hash = infoData();
      let ja_key = ja_hash[key] || key;
      return ja_key;
    },
    formatDetailValue(value) {
      if (value === null || value === undefined) return "N/A";
      if (typeof value === "number") {
        return this.formatPrice(value);
      } else if (typeof value === "string") {
        return value;
      } else if (Array.isArray(value)) {
        // 配列の場合、内容に応じてフォーマット
        return this.formatArrayValue(value);
      } else if (typeof value === "object") {
        // オブジェクトの場合、内容に応じてフォーマット
        return this.formatObjectValue(value);
      } else {
        return JSON.stringify(value); // その他の型は文字列化
      }
    },

    // 配列データのフォーマット
    formatArrayValue(array) {
      if (array.length === 0) return "なし";

      // 企業行動（配当など）
      if (array[0] && array[0].header === "Dividend") {
        return this.formatDividendInfo(array);
      }

      // 役員情報
      if (array[0] && array[0].name && array[0].title) {
        return this.formatExecutiveInfo(array);
      }

      // その他の配列
      return array
        .map((item) => {
          if (typeof item === "object") {
            return this.formatObjectValue(item);
          }
          return String(item);
        })
        .join(", ");
    },

    // オブジェクトデータのフォーマット
    formatObjectValue(obj) {
      if (obj === null || obj === undefined) return "N/A";

      // 企業行動の個別アイテム
      if (obj.header === "Dividend") {
        return this.formatDividendItem(obj);
      }

      // 役員情報の個別アイテム
      if (obj.name && obj.title) {
        return this.formatExecutiveItem(obj);
      }

      // その他のオブジェクト
      const entries = Object.entries(obj);
      if (entries.length === 0) return "なし";

      return entries
        .map(([key, value]) => {
          const label = this.formatLabel(key);
          const formattedValue = this.formatDetailValue(value);
          return `${label}: ${formattedValue}`;
        })
        .join(" | ");
    },

    // 配当情報のフォーマット
    formatDividendInfo(dividendArray) {
      if (dividendArray.length === 0) return "なし";

      return dividendArray
        .map((dividend) => {
          return this.formatDividendItem(dividend);
        })
        .join("<br>");
    },

    // 配当アイテムのフォーマット
    formatDividendItem(dividend) {
      const amount = dividend.amount || "N/A";
      const date = dividend.meta?.dateEpochMs
        ? new Date(dividend.meta.dateEpochMs).toLocaleDateString("ja-JP")
        : "N/A";

      return `配当: ¥${amount} (権利確定日: ${date})`;
    },

    // 役員情報のフォーマット
    formatExecutiveInfo(executives) {
      if (executives.length === 0) return "なし";

      return executives
        .map((exec) => {
          return this.formatExecutiveItem(exec);
        })
        .join("<br>");
    },

    // 役員アイテムのフォーマット
    formatExecutiveItem(exec) {
      const name = exec.name || "N/A";
      const title = exec.title || "N/A";
      const age = exec.age ? `${exec.age}歳` : "";
      const totalPay = exec.totalPay
        ? `報酬: ¥${(exec.totalPay / 10000).toFixed(0)}万円`
        : "";

      let info = `${name} (${title})`;
      if (age) info += ` - ${age}`;
      if (totalPay) info += ` - ${totalPay}`;

      return info;
    },

    // 企業行動データを取得
    getCorporateActions() {
      const actions = {};

      // 配当履歴以外の企業行動を抽出
      Object.entries(this.info).forEach(([key, value]) => {
        if (
          key !== "dividendHistory" &&
          key !== "companyOfficers" &&
          Array.isArray(value) &&
          value.length > 0
        ) {
          actions[key] = value;
        }
      });

      return actions;
    },
  },
};
</script>

<style scoped>
/* ヘッダーセクション */
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

/* タブナビゲーション */
.tab-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.tab-button:hover {
  color: #374151;
  background: #f9fafb;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: #eff6ff;
}

.tab-button i {
  font-size: 1.1rem;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.info-card.full-width {
  grid-column: 1 / -1;
}

.info-card h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #6b7280;
  font-weight: 500;
  font-size: 0.9rem;
}

.info-item .value {
  color: #1f2937;
  font-weight: 600;
  text-align: right;
}

/* チャートコンテナ */
.chart-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

/* データテーブル */
.data-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 2fr;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.header-cell {
  padding: 1rem;
  font-weight: 600;
  color: #374151;
  text-align: left;
}

.table-body {
  max-height: 500px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row:last-child {
  border-bottom: none;
}

.cell {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
}

.cell.label {
  font-weight: 500;
  color: #6b7280;
  background: #f9fafb;
}

.cell.value {
  color: #1f2937;
  word-break: break-word;
}

/* 企業行動・役員情報タブ用スタイル */
.info-content {
  line-height: 1.6;
}

.executives-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.executive-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.executive-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e0;
}

.executive-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.executive-header h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.executive-title {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

.executive-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.executive-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.executive-detail .label {
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
}

.executive-detail .value {
  color: #1f2937;
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
