<template>
  <div class="nikkei-info">
    <!-- ヘッダーセクション -->
    <div class="nikkei-header-section">
      <div class="nikkei-header-content">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="goBack"
          class="back-btn"
        />
        <div class="header-text">
          <h1 class="header-title">日経平均指数</h1>
          <p class="header-subtitle">市場全体のトレンド分析</p>
        </div>
      </div>
    </div>

    <!-- メインコンテンツ -->
    <div class="main-content">
      <!-- 統計情報カード -->
      <div class="stats-grid">
        <v-card class="stat-card" elevation="2">
          <v-card-title class="stat-title">
            <v-icon> mdi-trending-up </v-icon>
            二市場合計 信用倍率
          </v-card-title>
          <v-card-text class="stat-content">
            <div class="stat-value">{{ currentMargin }}</div>
          </v-card-text>
        </v-card>

        <v-card class="stat-card" elevation="2">
          <v-card-title class="stat-title">
            <v-icon> mdi-calendar </v-icon>
            最終更新
          </v-card-title>
          <v-card-text class="stat-content">
            <div class="stat-value">{{ lastUpdateDate }}</div>
            <div class="stat-time">{{ lastUpdateTime }}</div>
          </v-card-text>
        </v-card>

        <v-card class="stat-card" elevation="2">
          <v-card-title class="stat-title">
            <v-icon> mdi-chart-box </v-icon>
            出来高
          </v-card-title>
          <v-card-text class="stat-content">
            <div class="stat-value">{{ volume }}</div>
            <div class="stat-label">株</div>
          </v-card-text>
        </v-card>
      </div>

      <!-- 詳細情報セクション -->
      <v-card class="detail-card" elevation="2">
        <v-card-title class="detail-title">
          <v-icon class="mr-2"> mdi-information </v-icon>
          詳細情報
        </v-card-title>
        <v-divider />
        <v-card-text class="detail-content">
          <div class="info-row">
            <span class="info-label">高値:</span>
            <span class="info-value">{{ highValue }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">安値:</span>
            <span class="info-value">{{ lowValue }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">始値:</span>
            <span class="info-value">{{ openValue }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">終値:</span>
            <span class="info-value">{{ closeValue }}</span>
          </div>
        </v-card-text>
      </v-card>

      <!-- チャートセクション -->
      <v-card class="chart-card" elevation="2">
        <v-card-title class="chart-title">
          <v-icon class="mr-2"> mdi-chart-line </v-icon>
          チャート
          <div class="chart-container">
            <StockChart :stock-data="history" />
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="chart-content">
          <div class="placeholder-chart">
            <v-icon size="64" color="primary"> mdi-chart-line </v-icon>
            <p>チャートデータは準備中です</p>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import StockChart from "@/components/StockChart.vue";
import apiService from "@/services/apiService";
import firestore from "@/firestore.js";
import { getDocs, query, collectionGroup } from "firebase/firestore";

const db = firestore.db;

export default {
  name: "NikkeiInfoView",
  components: {
    StockChart,
  },
  data() {
    return {
      currentMargin: "",
      isPositive: true,
      lastUpdateDate: "2026-01-01",
      lastUpdateTime: "15:30",
      volume: "1,250,000",
      highValue: "28,950.00",
      lowValue: "28,650.00",
      openValue: "28,700.00",
      closeValue: "28,800.00",
      history: [],
      nikkeiData: [],
      loading: false,
      info: {},
    };
  },
  mounted() {
    this.getStockInfo();
    this.getNikkeiData();
    console.log("NikkeiInfoView mounted");
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    async getStockInfo() {
      try {
        console.log("Fetching stock info for code: nikkei225");
        const data = await apiService.getStockInfo("^N225");

        this.info = data.info;
        this.history = data.history;
        const latest = this.history.slice(-1)[0];
        console.log("history:", latest);
        this.highValue = Math.round(latest.high);
        this.lowValue = Math.round(latest.low);
        this.openValue = Math.round(latest.open);
        this.closeValue = Math.round(latest.close);
        this.lastUpdateDate = latest.time;
      } catch (e) {
        this.message = "エラー: " + e;
      }
    },
    async getMarginData() {
      try {
        const data = await apiService.getMarginData("nikkei225");
        console.log("Margin Data:", data);
      } catch (e) {
        console.error("Error fetching margin data:", e);
      }
    },
    async getNikkeiData() {
      this.loading = true;
      try {
        const group = collectionGroup(
          db,
          "合計 Total_二市場合計 Total_金額 Val.",
        );
        const collections = query(group);
        let sub = await getDocs(collections);
        this.nikkeiData = [];
        sub.forEach((doc) => {
          this.nikkeiData.push(doc.data());
        });
        const latestMarginData = this.nikkeiData[this.nikkeiData.length - 1];
        const currntratio =
          latestMarginData["買残高 Purchases"] /
          latestMarginData["売残高 Sales"];
        this.currentMargin = currntratio.toFixed(2);
        console.log("Nikkei Data fetched:", this.nikkeiData);
      } catch (e) {
        console.error("Error fetching Nikkei data:", e);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.nikkei-info {
  min-height: 100vh;
  background: #f8fafc;
}

/* ヘッダーセクション */
.nikkei-header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 20px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.nikkei-header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  color: white;
  font-size: 24px;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 1rem;
  margin: 0;
  opacity: 0.9;
}

/* メインコンテンツ */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 統計情報グリッド */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12) !important;
}

.stat-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-content {
  padding: 24px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 8px;
}

.stat-change {
  font-size: 0.95rem;
  color: #dc2626;
  font-weight: 500;
}

.stat-change.positive {
  color: #16a34a;
}

.stat-time {
  font-size: 0.85rem;
  color: #999;
  margin-top: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-top: 4px;
}

/* 詳細情報カード */
.detail-card,
.chart-card {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
  background: white;
}

.detail-title,
.chart-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.detail-content {
  padding: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
}

.info-value.positive {
  color: #16a34a;
}

/* チャートセクション */
.chart-content {
  padding: 60px 24px;
}

.placeholder-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  opacity: 0.6;
}

.placeholder-chart p {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .nikkei-header-section {
    padding: 24px 16px;
  }

  .nikkei-header-content {
    gap: 12px;
  }

  .header-title {
    font-size: 1.5rem;
  }

  .header-subtitle {
    font-size: 0.9rem;
  }

  .main-content {
    padding: 24px 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 1.25rem;
  }

  .header-subtitle {
    font-size: 0.8rem;
  }

  .back-btn {
    font-size: 20px;
  }

  .stat-value {
    font-size: 1.3rem;
  }

  .detail-content {
    padding: 16px;
  }

  .info-row {
    padding: 8px 0;
    font-size: 0.9rem;
  }
}
</style>
