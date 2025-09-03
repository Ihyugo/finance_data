<template>
  <div class="stock-chart-container">
    <!-- 期間選択コントロール -->
    <div class="controls-section">
      <div class="period-buttons">
        <button
          v-for="period in periodOptions"
          :key="period.value"
          :class="['period-btn', { active: selectedPeriod === period.value }]"
          :disabled="isDrawing"
          @click="setPeriod(period.value)"
        >
          {{ period.label }}
        </button>
      </div>

      <!-- カスタム期間スライダー -->
      <div
        v-if="selectedPeriod === 'custom'"
        class="custom-range-control"
      >
        <div class="range-inputs">
          <div class="range-input-group">
            <label>開始:</label>
            <input
              v-model="customRange.start"
              type="range"
              :min="0"
              :max="stockData.length - 1"
              :disabled="isDrawing"
              @input="updateCustomRange"
            >
            <span>{{ getDateLabel(customRange.start) }}</span>
          </div>
          <div class="range-input-group">
            <label>終了:</label>
            <input
              v-model="customRange.end"
              type="range"
              :min="customRange.start"
              :max="stockData.length - 1"
              :disabled="isDrawing"
              @input="updateCustomRange"
            >
            <span>{{ getDateLabel(customRange.end) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- テクニカル指標コントロール -->
    <div class="indicators-section">
      <h4>テクニカル指標</h4>
      <div class="indicator-controls">
        <div class="indicator-group">
          <label
            class="indicator-checkbox"
            :class="{ disabled: isDrawing }"
          >
            <input
              v-model="indicators.movingAverage.enabled"
              type="checkbox"
              :disabled="isDrawing"
              @change="updateCharts"
            >
            移動平均線 (5, 25, 75日)
          </label>
        </div>

        <div class="indicator-group">
          <label
            class="indicator-checkbox"
            :class="{ disabled: isDrawing }"
          >
            <input
              v-model="indicators.bollingerBands.enabled"
              type="checkbox"
              :disabled="isDrawing"
              @change="updateCharts"
            >
            ボリンジャーバンド (±1,2,3,4σ)
          </label>
        </div>

        <div class="indicator-group">
          <label
            class="indicator-checkbox"
            :class="{ disabled: isDrawing }"
          >
            <input
              v-model="indicators.parabolic.enabled"
              type="checkbox"
              :disabled="isDrawing"
              @change="updateCharts"
            >
            パラボリックSAR
          </label>
        </div>

        <!-- 描画中の表示 -->
        <div
          v-if="isDrawing"
          class="drawing-status"
        >
          <div class="spinner" />
          <span>チャートを更新中...</span>
        </div>
      </div>
    </div>

    <!-- メインチャート（ローソク足） -->
    <StockPriceChart
      :stock-data="currentStockData"
      :chart-key="mainChartKey"
      :indicators="indicators"
      @chart-ready="onChartReady"
    />

    <!-- MACDチャート -->
    <MACDChart
      :stock-data="currentStockData"
      :chart-key="macdChartKey"
      @chart-ready="onChartReady"
    />

    <!-- RSIチャート -->
    <RSIChart
      :stock-data="currentStockData"
      :chart-key="rsiChartKey"
      @chart-ready="onChartReady"
    />
  </div>
</template>

<script>
import StockPriceChart from "./charts/StockPriceChart.vue";
import MACDChart from "./charts/MACDChart.vue";
import RSIChart from "./charts/RSIChart.vue";

export default {
  name: "StockChart",
  components: {
    StockPriceChart,
    MACDChart,
    RSIChart,
  },
  props: {
    stockData: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data() {
    return {
      mainChartKey: 0, // 株価チャート用のキー
      macdChartKey: 0, // MACDチャート用のキー
      rsiChartKey: 0, // RSIチャート用のキー
      isDrawing: false, // 描画中フラグを追加
      chartsReadyCount: 0, // 描画完了チャート数をカウント
      isMainChartOnlyUpdate: false, // 株価チャートのみの更新かどうか
      selectedPeriod: "3M",
      customRange: {
        start: 0,
        end: 100,
      },
      periodOptions: [
        { label: "1M", value: "1M" },
        { label: "3M", value: "3M" },
        { label: "6M", value: "6M" },
        { label: "1Y", value: "1Y" },
        { label: "2Y", value: "2Y" },
        { label: "ALL", value: "ALL" },
        { label: "Custom", value: "custom" },
      ],
      indicators: {
        movingAverage: {
          enabled: false,
          periods: [5, 25, 75],
          colors: ["#ff6b6b", "#4ecdc4", "#45b7d1"],
        },
        bollingerBands: {
          enabled: false,
          period: 20,
          multipliers: [1, 2, 3, 4],
          colors: [
            "rgba(255, 206, 84, 0.3)",
            "rgba(54, 162, 235, 0.3)",
            "rgba(255, 99, 132, 0.3)",
            "rgba(75, 192, 192, 0.3)",
          ],
        },
        parabolic: {
          enabled: false,
          step: 0.02,
          maximum: 0.2,
          color: "#ff9500",
        },
      },
    };
  },
  computed: {
    currentStockData() {
      if (!this.stockData || this.stockData.length === 0) {
        return [];
      }

      if (this.selectedPeriod === "custom") {
        return this.stockData.slice(
          this.customRange.start,
          this.customRange.end + 1
        );
      }

      const periodMap = {
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "1Y": 365,
        "2Y": 730,
        ALL: this.stockData.length,
      };

      const days = periodMap[this.selectedPeriod] || this.stockData.length;
      const startIndex = Math.max(0, this.stockData.length - days);

      return this.stockData.slice(startIndex);
    },
  },
  watch: {
    stockData: {
      handler(newData) {
        console.log("stockData changed:", newData ? newData.length : "null");
        if (newData && newData.length > 0) {
          this.customRange.end = newData.length - 1;
          // 初期データ読み込み時は全チャートを更新
          this.updateAllCharts();
        }
      },
      deep: true,
      immediate: false,
    },
    currentStockData: {
      handler() {
        // データ変更時は全チャートを更新
        this.updateAllCharts();
      },
      deep: true,
    },
  },
  mounted() {
    console.log("StockChart mounted, stockData:", this.stockData);
    if (this.stockData && this.stockData.length > 0) {
      this.customRange.end = this.stockData.length - 1;
    }
  },
  methods: {
    setPeriod(period) {
      this.selectedPeriod = period;
      // 期間変更時は全チャートを更新
      this.updateAllCharts();
    },

    updateCustomRange() {
      // 開始が終了より後にならないようにする
      if (this.customRange.start >= this.customRange.end) {
        this.customRange.end = Math.min(
          this.stockData.length - 1,
          parseInt(this.customRange.start) + 1
        );
      }
      // カスタム範囲変更時は全チャートを更新
      this.updateAllCharts();
    },

    getDateLabel(index) {
      if (!this.stockData || !this.stockData[index]) {
        return "";
      }
      const item = this.stockData[index];
      return item.x || item.time || item.date || index;
    },

    async updateCharts() {
      try {
        // 描画中フラグを設定
        this.isDrawing = true;
        this.isMainChartOnlyUpdate = true; // 株価チャートのみの更新

        // 描画完了カウンターをリセット
        this.chartsReadyCount = 0;

        // 株価チャートのみを更新（テクニカル指標変更時）
        this.mainChartKey++;

        console.log("Updating main chart with key:", this.mainChartKey);
      } catch (error) {
        console.error("Error updating charts:", error);
        // エラーが発生した場合もフラグをリセット
        this.isDrawing = false;
        this.isMainChartOnlyUpdate = false;
      }
    },

    // 期間変更時に全チャートを更新
    async updateAllCharts() {
      try {
        // 描画中フラグを設定
        this.isDrawing = true;
        this.isMainChartOnlyUpdate = false; // 全チャートの更新

        // 描画完了カウンターをリセット
        this.chartsReadyCount = 0;

        // 全チャートを更新
        this.mainChartKey++;
        this.macdChartKey++;
        this.rsiChartKey++;

        console.log("Updating all charts with keys:", {
          main: this.mainChartKey,
          macd: this.macdChartKey,
          rsi: this.rsiChartKey,
        });
      } catch (error) {
        console.error("Error updating all charts:", error);
        // エラーが発生した場合もフラグをリセット
        this.isDrawing = false;
        this.isMainChartOnlyUpdate = false;
      }
    },

    onChartReady() {
      this.chartsReadyCount++;

      if (this.isMainChartOnlyUpdate) {
        // 株価チャートのみの更新の場合
        console.log(`Main chart ready: ${this.chartsReadyCount}/1`);

        // 株価チャートが完了したら描画中フラグをリセット
        if (this.chartsReadyCount >= 1) {
          setTimeout(() => {
            this.isDrawing = false;
            this.chartsReadyCount = 0;
            this.isMainChartOnlyUpdate = false;
            console.log("Main chart ready, enabling controls");
          }, 200);
        }
      } else {
        // 全チャートの更新の場合
        console.log(`Chart ready: ${this.chartsReadyCount}/3`);

        // 全てのチャートが描画完了したら描画中フラグをリセット
        if (this.chartsReadyCount >= 3) {
          setTimeout(() => {
            this.isDrawing = false;
            this.chartsReadyCount = 0;
            this.isMainChartOnlyUpdate = false;
            console.log("All charts ready, enabling controls");
          }, 200); // 少し余裕を持ってから有効化
        }
      }
    },
  },
};
</script>

<style scoped>
.stock-chart-container {
  width: 100%;
  background: #1a202c;
  color: #a0aec0;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  min-height: 600px;
}

.controls-section {
  background: rgba(45, 55, 72, 0.5);
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 6px;
}

.period-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.period-btn {
  padding: 8px 16px;
  background: rgba(74, 85, 104, 0.8);
  border: 1px solid rgba(160, 174, 192, 0.3);
  border-radius: 4px;
  color: #a0aec0;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.period-btn:hover:not(:disabled) {
  background: rgba(74, 85, 104, 1);
  border-color: rgba(160, 174, 192, 0.5);
}

.period-btn.active {
  background: #4299e1;
  border-color: #4299e1;
  color: white;
}

.period-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(74, 85, 104, 0.5);
  border-color: rgba(160, 174, 192, 0.2);
  color: #718096;
}

.custom-range-control {
  border-top: 1px solid rgba(160, 174, 192, 0.2);
  padding-top: 15px;
}

.range-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.range-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-input-group label {
  font-size: 14px;
  min-width: 50px;
  color: #a0aec0;
  font-weight: 500;
}

.range-input-group input[type="range"] {
  flex: 1;
  height: 6px;
  background: rgba(74, 85, 104, 0.8);
  border-radius: 3px;
  outline: none;
}

.range-input-group input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
}

.range-input-group input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
  border: none;
}

.range-input-group span {
  font-size: 12px;
  color: #718096;
  min-width: 100px;
}

.indicators-section {
  background: rgba(45, 55, 72, 0.5);
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 6px;
}

.indicators-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #e2e8f0;
  font-weight: 600;
}

.indicator-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.indicator-group {
  display: flex;
  align-items: center;
}

.indicator-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #a0aec0;
  user-select: none;
  transition: color 0.2s ease;
}

.indicator-checkbox:hover:not(.disabled) {
  color: #e2e8f0;
}

.indicator-checkbox input[type="checkbox"] {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  accent-color: #4299e1;
  cursor: pointer;
}

.indicator-checkbox.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.indicator-checkbox.disabled input[type="checkbox"] {
  cursor: not-allowed;
}

.drawing-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  color: #718096;
  font-size: 0.875rem;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #3498db;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .stock-chart-container {
    padding: 15px;
    margin: 15px 0;
  }

  .period-buttons {
    justify-content: center;
  }

  .period-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .range-inputs {
    gap: 8px;
  }

  .range-input-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .range-input-group label {
    min-width: auto;
  }

  .indicator-controls {
    flex-direction: column;
    gap: 10px;
  }

  .indicator-checkbox {
    font-size: 13px;
  }
}
</style>
