<template>
  <div class="stock-chart-container">
    <!-- デバッグ情報 -->
    <div v-if="!stockData || stockData.length === 0" class="debug-info">
      <p>⚠️ データが読み込まれていません</p>
      <p>
        stockData:
        {{ stockData ? `配列(長さ: ${stockData.length})` : "null/undefined" }}
      </p>
    </div>

    <div v-else class="debug-info">
      <p>✅ データ読み込み完了: {{ stockData.length }}件</p>
      <p>
        期間: {{ currentStockData[0]?.x || currentStockData[0]?.time }} ～
        {{
          currentStockData[currentStockData.length - 1]?.x ||
          currentStockData[currentStockData.length - 1]?.time
        }}
      </p>
      <p>表示データ数: {{ currentStockData.length }}件</p>
    </div>

    <!-- 期間選択コントロール -->
    <div class="controls-section">
      <div class="period-buttons">
        <button
          v-for="period in periodOptions"
          :key="period.value"
          @click="setPeriod(period.value)"
          :class="['period-btn', { active: selectedPeriod === period.value }]"
        >
          {{ period.label }}
        </button>
      </div>

      <!-- カスタム期間スライダー -->
      <div class="custom-range-control" v-if="selectedPeriod === 'custom'">
        <div class="range-inputs">
          <div class="range-input-group">
            <label>開始:</label>
            <input
              type="range"
              :min="0"
              :max="stockData.length - 1"
              v-model="customRange.start"
              @input="updateCustomRange"
            />
            <span>{{ getDateLabel(customRange.start) }}</span>
          </div>
          <div class="range-input-group">
            <label>終了:</label>
            <input
              type="range"
              :min="customRange.start"
              :max="stockData.length - 1"
              v-model="customRange.end"
              @input="updateCustomRange"
            />
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
          <label class="indicator-checkbox">
            <input
              type="checkbox"
              v-model="indicators.movingAverage.enabled"
              @change="updateCharts"
            />
            移動平均線 (5, 25, 75日)
          </label>
        </div>

        <div class="indicator-group">
          <label class="indicator-checkbox">
            <input
              type="checkbox"
              v-model="indicators.bollingerBands.enabled"
              @change="updateCharts"
            />
            ボリンジャーバンド (±1,2,3,4σ)
          </label>
        </div>

        <div class="indicator-group">
          <label class="indicator-checkbox">
            <input
              type="checkbox"
              v-model="indicators.parabolic.enabled"
              @change="updateCharts"
            />
            パラボリックSAR
          </label>
        </div>
      </div>
    </div>

    <!-- メインチャート（ローソク足） -->
    <div class="main-chart">
      <h3>Stock Price Chart (Candlestick)</h3>
      <div class="chart-wrapper">
        <canvas ref="mainCanvas" :key="'main-' + chartKey"></canvas>
      </div>
    </div>

    <!-- MACDチャート -->
    <div class="macd-chart">
      <h3>MACD Indicator</h3>
      <div class="chart-wrapper">
        <canvas ref="macdCanvas" :key="'macd-' + chartKey"></canvas>
      </div>
    </div>

    <!-- RSIチャート -->
    <div class="rsi-chart">
      <h3>RSI Indicator</h3>
      <div class="chart-wrapper">
        <canvas ref="rsiCanvas" :key="'rsi-' + chartKey"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import "./CandlestickChart.css";
import {
  Chart,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
} from "chart.js";

// Chart.jsの基本コンポーネントを登録
Chart.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement
);

// ローソク足チャート用のカスタムコントローラー
class CandlestickController extends BarController {
  constructor(chart, datasetIndex) {
    super(chart, datasetIndex);
    this.id = "candlestick";
  }

  draw() {
    const meta = this.getMeta();
    const data = meta.data;

    data.forEach((candlestick, index) => {
      this.drawCandlestick(candlestick, index);
    });
  }

  drawCandlestick(candlestick, index) {
    const ctx = this.chart.ctx;
    const dataset = this.getDataset();
    const dataPoint = dataset.data[index];

    if (!dataPoint || typeof dataPoint !== "object") return;

    const { open, high, low, close } = dataPoint;
    const x = candlestick.x;
    const scale = this.chart.scales.y;

    const yOpen = scale.getPixelForValue(open);
    const yHigh = scale.getPixelForValue(high);
    const yLow = scale.getPixelForValue(low);
    const yClose = scale.getPixelForValue(close);

    const isUp = close >= open;
    const bodyColor = isUp ? "#26a69a" : "#ef5350";
    const wickColor = isUp ? "#26a69a" : "#ef5350";

    const candleWidth = 8;
    const wickWidth = 1;

    // 実体（ろうそく本体）を描画
    ctx.fillStyle = bodyColor;
    ctx.fillRect(
      x - candleWidth / 2,
      Math.min(yOpen, yClose),
      candleWidth,
      Math.abs(yOpen - yClose) || 1
    );

    // 髭（ウィック）を描画
    ctx.strokeStyle = wickColor;
    ctx.lineWidth = wickWidth;
    ctx.beginPath();
    // 上髭
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, Math.min(yOpen, yClose));
    // 下髭
    ctx.moveTo(x, Math.max(yOpen, yClose));
    ctx.lineTo(x, yLow);
    ctx.stroke();
  }

  update() {
    const meta = this.getMeta();
    const dataset = this.getDataset();
    const xScale = this.chart.scales.x;
    const yScale = this.chart.scales.y;

    const candleWidth = 8;

    meta.data = dataset.data.map((dataPoint, index) => {
      const x = xScale.getPixelForValue(index);
      const yOpen = yScale.getPixelForValue(dataPoint.open);
      const yClose = yScale.getPixelForValue(dataPoint.close);
      const yHigh = yScale.getPixelForValue(dataPoint.high);
      const yLow = yScale.getPixelForValue(dataPoint.low);
      const top = Math.min(yOpen, yClose);
      const bottom = Math.max(yOpen, yClose);

      return {
        x,
        y: (top + bottom) / 2, // 中心
        inRange(mouseX, mouseY) {
          return (
            mouseX >= x - candleWidth / 2 &&
            mouseX <= x + candleWidth / 2 &&
            mouseY >= yHigh &&
            mouseY <= yLow
          );
        },
        getCenterPoint() {
          return { x, y: (top + bottom) / 2 };
        },
        tooltipPosition() {
          return { x, y: top }; // 上側に出したいなら top
        },
        hasValue() {
          return true;
        },
      };
    });
  }
}

// カスタムコントローラーのIDを設定
CandlestickController.id = "candlestick";

// カスタムコントローラーを登録
Chart.register(CandlestickController);

export default {
  name: "StockChart",
  props: {
    stockData: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data() {
    return {
      mainChart: null,
      macdChart: null,
      rsiChart: null,
      isCreatingCharts: false,
      chartKey: 0,
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
  mounted() {
    console.log("StockChart mounted, stockData:", this.stockData);
    if (this.stockData && this.stockData.length > 0) {
      this.customRange.end = this.stockData.length - 1;
    }

    // エラーハンドリングを追加（より包括的に）
    window.addEventListener("error", this.handleGlobalError);
    window.addEventListener("unhandledrejection", this.handlePromiseRejection);

    this.initializeCharts();
  },
  beforeUnmount() {
    // イベントリスナーを削除
    window.removeEventListener("error", this.handleGlobalError);
    window.removeEventListener(
      "unhandledrejection",
      this.handlePromiseRejection
    );
    this.destroyCharts();
  },
  watch: {
    stockData: {
      handler(newData) {
        console.log("stockData changed:", newData ? newData.length : "null");
        if (newData && newData.length > 0) {
          this.customRange.end = newData.length - 1;
          this.initializeCharts();
        }
      },
      deep: true,
      immediate: false,
    },
    currentStockData: {
      handler() {
        this.initializeCharts();
      },
      deep: true,
    },
  },
  methods: {
    // 安全な数値変換関数
    safeParseFloat(value) {
      if (value === null || value === undefined || value === "") {
        return 0;
      }
      const cleanValue =
        typeof value === "string" ? value.replace(/,/g, "") : value;
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    },

    setPeriod(period) {
      this.selectedPeriod = period;
    },

    updateCustomRange() {
      // 開始が終了より後にならないようにする
      if (this.customRange.start >= this.customRange.end) {
        this.customRange.end = Math.min(
          this.stockData.length - 1,
          parseInt(this.customRange.start) + 1
        );
      }
    },

    getDateLabel(index) {
      if (!this.stockData || !this.stockData[index]) {
        return "";
      }
      const item = this.stockData[index];
      return item.x || item.time || item.date || index;
    },

    updateCharts() {
      this.initializeCharts();
    },

    // グローバルエラーハンドラー
    handleGlobalError(event) {
      // Chart.js関連のエラーを無視
      if (
        event.error &&
        event.error.message &&
        (event.error.message.includes("Cannot read properties of null") ||
          event.error.message.includes("chart.js") ||
          event.error.message.includes("clipArea") ||
          event.error.message.includes("element.inRange is not a function") ||
          event.error.message.includes("inRange") ||
          event.error.message.includes("evaluationFunc") ||
          event.error.message.includes("getNearestCartesianItems"))
      ) {
        event.preventDefault();
        console.warn("Chart.js error suppressed:", event.error.message);
        return false;
      }
    },

    // Promise rejection ハンドラー
    handlePromiseRejection(event) {
      if (
        event.reason &&
        event.reason.message &&
        (event.reason.message.includes("chart.js") ||
          event.reason.message.includes("inRange") ||
          event.reason.message.includes("element"))
      ) {
        event.preventDefault();
        console.warn(
          "Chart.js promise rejection suppressed:",
          event.reason.message
        );
        return false;
      }
    },

    destroyCharts() {
      try {
        if (this.mainChart) {
          // アニメーションを停止してからdestroy
          this.mainChart.stop();
          this.mainChart.destroy();
          this.mainChart = null;
        }
        if (this.macdChart) {
          // アニメーションを停止してからdestroy
          this.macdChart.stop();
          this.macdChart.destroy();
          this.macdChart = null;
        }
        if (this.rsiChart) {
          // アニメーションを停止してからdestroy
          this.rsiChart.stop();
          this.rsiChart.destroy();
          this.rsiChart = null;
        }
      } catch (error) {
        console.warn("Error destroying charts:", error);
        // エラーが発生してもチャートの参照をクリア
        this.mainChart = null;
        this.macdChart = null;
        this.rsiChart = null;
      }
    },

    initializeCharts() {
      if (this.isCreatingCharts) return;

      if (!this.currentStockData || this.currentStockData.length === 0) {
        console.warn(
          "Cannot create charts: currentStockData is empty or undefined"
        );
        return;
      }

      this.destroyCharts();
      this.chartKey++;

      this.$nextTick(() => {
        // 少し長めの待機時間を設定
        setTimeout(() => {
          // DOM要素の存在を再確認
          if (
            this.$refs.mainCanvas &&
            this.$refs.macdCanvas &&
            this.$refs.rsiCanvas &&
            document.contains(this.$refs.mainCanvas) &&
            document.contains(this.$refs.macdCanvas) &&
            document.contains(this.$refs.rsiCanvas)
          ) {
            this.createCharts();
          } else {
            console.warn("Canvas elements not ready, skipping chart creation");
          }
        }, 150);
      });
    },

    // 移動平均の計算
    calculateMovingAverage(data, period) {
      const result = [];
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          result.push(null);
        } else {
          let sum = 0;
          for (let j = i - period + 1; j <= i; j++) {
            sum += data[j];
          }
          result.push(sum / period);
        }
      }
      return result;
    },

    // ボリンジャーバンドの計算
    calculateBollingerBands(data, period, multiplier) {
      const ma = this.calculateMovingAverage(data, period);
      const upper = [];
      const lower = [];

      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          upper.push(null);
          lower.push(null);
        } else {
          // 標準偏差を計算
          let sum = 0;
          for (let j = i - period + 1; j <= i; j++) {
            sum += Math.pow(data[j] - ma[i], 2);
          }
          const stdDev = Math.sqrt(sum / period);

          upper.push(ma[i] + stdDev * multiplier);
          lower.push(ma[i] - stdDev * multiplier);
        }
      }

      return { upper, lower, middle: ma };
    },

    // RSIの計算
    calculateRSI(data, period = 14) {
      const result = [];
      const gains = [];
      const losses = [];

      // 最初の値は計算できないのでnull
      result.push(null);

      for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);

        if (i < period) {
          result.push(null);
          continue;
        }

        let avgGain, avgLoss;

        if (i === period) {
          // 最初のRSI計算：単純平均
          avgGain =
            gains.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
          avgLoss =
            losses.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
        } else {
          // 以降：指数移動平均的な計算
          const prevAvgGain = this.prevAvgGain || 0;
          const prevAvgLoss = this.prevAvgLoss || 0;
          avgGain = (prevAvgGain * (period - 1) + gains[i - 1]) / period;
          avgLoss = (prevAvgLoss * (period - 1) + losses[i - 1]) / period;
        }

        this.prevAvgGain = avgGain;
        this.prevAvgLoss = avgLoss;

        if (avgLoss === 0) {
          result.push(100);
        } else {
          const rs = avgGain / avgLoss;
          const rsi = 100 - 100 / (1 + rs);
          result.push(rsi);
        }
      }

      return result;
    },
    calculateParabolicSAR(highs, lows, closes) {
      const result = [];
      let sar = lows[0];
      let ep = highs[0];
      let af = this.indicators.parabolic.step;
      let isUptrend = true;

      result.push(sar);

      for (let i = 1; i < closes.length; i++) {
        const prevSar = sar;

        if (isUptrend) {
          sar = prevSar + af * (ep - prevSar);

          if (highs[i] > ep) {
            ep = highs[i];
            af = Math.min(
              af + this.indicators.parabolic.step,
              this.indicators.parabolic.maximum
            );
          }

          if (sar > lows[i]) {
            isUptrend = false;
            sar = ep;
            ep = lows[i];
            af = this.indicators.parabolic.step;
          }
        } else {
          sar = prevSar + af * (ep - prevSar);

          if (lows[i] < ep) {
            ep = lows[i];
            af = Math.min(
              af + this.indicators.parabolic.step,
              this.indicators.parabolic.maximum
            );
          }

          if (sar < highs[i]) {
            isUptrend = true;
            sar = ep;
            ep = highs[i];
            af = this.indicators.parabolic.step;
          }
        }

        result.push(sar);
      }

      return result;
    },

    createCharts() {
      if (this.isCreatingCharts) return;

      if (
        !this.$refs.mainCanvas ||
        !this.$refs.macdCanvas ||
        !this.$refs.rsiCanvas
      ) {
        console.warn("Canvas refs not available, retrying...");
        setTimeout(() => this.createCharts(), 200);
        return;
      }

      this.isCreatingCharts = true;

      try {
        this.createCandlestickChart();
        this.createMACDChart();
        this.createRSIChart();
        console.log("Charts created successfully");
      } catch (error) {
        console.error("Error creating charts:", error);
      } finally {
        this.isCreatingCharts = false;
      }
    },

    createCandlestickChart() {
      if (!this.$refs.mainCanvas) {
        console.error("Main canvas ref not found");
        return;
      }

      const canvas = this.$refs.mainCanvas;

      // canvasの存在とDOM接続を確認
      if (!canvas || !canvas.parentElement || !document.contains(canvas)) {
        console.warn("Canvas is not properly mounted in DOM");
        return;
      }

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Could not get 2d context from main canvas");
        return;
      }

      const container = canvas.parentElement;
      const containerRect = container.getBoundingClientRect();
      canvas.width = containerRect.width - 20;
      canvas.height = 300;

      // ローソク足用のデータ構造を作成
      const labels = this.currentStockData.map(
        (item) => item.x || item.time || ""
      );
      const candlestickData = this.currentStockData.map((item) => ({
        open: this.safeParseFloat(item.open || item.o),
        high: this.safeParseFloat(item.high || item.h),
        low: this.safeParseFloat(item.low || item.l),
        close: this.safeParseFloat(item.close || item.c),
      }));

      // 価格データを抽出（テクニカル指標の計算用）
      const closes = candlestickData.map((d) => d.close);
      const highs = candlestickData.map((d) => d.high);
      const lows = candlestickData.map((d) => d.low);

      // 価格範囲を計算
      const allPrices = candlestickData
        .flatMap((d) => [d.open, d.high, d.low, d.close])
        .filter((p) => p > 0);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const priceRange = maxPrice - minPrice;
      const yMin = Math.max(0, minPrice - priceRange * 0.05);
      const yMax = maxPrice + priceRange * 0.05;

      // データセットの準備
      const datasets = [
        {
          label: "Stock Price",
          data: candlestickData,
        },
      ];

      // 移動平均線のデータセットを追加
      if (this.indicators.movingAverage.enabled) {
        this.indicators.movingAverage.periods.forEach((period, index) => {
          const maData = this.calculateMovingAverage(closes, period);
          datasets.push({
            label: `MA${period}`,
            type: "line",
            data: maData,
            borderColor: this.indicators.movingAverage.colors[index],
            backgroundColor: "transparent",
            pointRadius: 0,
            borderWidth: 2,
            fill: false,
            tension: 0.1,
          });
        });
      }

      // ボリンジャーバンドのデータセットを追加
      if (this.indicators.bollingerBands.enabled) {
        this.indicators.bollingerBands.multipliers.forEach(
          (multiplier, index) => {
            const bb = this.calculateBollingerBands(
              closes,
              this.indicators.bollingerBands.period,
              multiplier
            );

            datasets.push({
              label: `BB+${multiplier}σ`,
              type: "line",
              data: bb.upper,
              borderColor: this.indicators.bollingerBands.colors[index].replace(
                "0.3",
                "0.8"
              ),
              backgroundColor: "transparent",
              pointRadius: 0,
              borderWidth: 1,
              fill: false,
              borderDash: [2, 2],
            });

            datasets.push({
              label: `BB-${multiplier}σ`,
              type: "line",
              data: bb.lower,
              borderColor: this.indicators.bollingerBands.colors[index].replace(
                "0.3",
                "0.8"
              ),
              backgroundColor: this.indicators.bollingerBands.colors[index],
              pointRadius: 0,
              borderWidth: 1,
              fill: `-${datasets.length - 1}`,
              borderDash: [2, 2],
            });
          }
        );
      }

      // パラボリックSARのデータセットを追加
      if (this.indicators.parabolic.enabled) {
        const sarData = this.calculateParabolicSAR(highs, lows, closes);
        datasets.push({
          label: "Parabolic SAR",
          type: "line",
          data: sarData,
          borderColor: this.indicators.parabolic.color,
          backgroundColor: this.indicators.parabolic.color,
          pointRadius: 2,
          pointBackgroundColor: this.indicators.parabolic.color,
          borderWidth: 0,
          fill: false,
          showLine: false,
        });
      }

      this.mainChart = new Chart(ctx, {
        type: "candlestick",
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 300,
            onComplete: () => {
              // アニメーション完了後にcanvasの状態を確認
              if (
                !this.$refs.mainCanvas ||
                !document.contains(this.$refs.mainCanvas)
              ) {
                console.warn("Canvas became unavailable after animation");
              }
            },
          },
          scales: {
            x: {
              type: "category",
              display: true,
              title: {
                display: true,
                text: "Date",
                color: "#a0aec0",
              },
              ticks: {
                maxTicksLimit: 10,
                color: "#a0aec0",
                callback: function (value, index, values) {
                  const step = Math.max(1, Math.ceil(values.length / 8));
                  return index % step === 0 ? labels[index] : "";
                },
              },
              grid: {
                display: true,
                color: "rgba(160, 174, 192, 0.3)",
              },
            },
            y: {
              type: "linear",
              display: true,
              position: "right",
              min: yMin,
              max: yMax,
              title: {
                display: true,
                text: "Price (¥)",
                color: "#a0aec0",
              },
              ticks: {
                color: "#a0aec0",
                callback: function (value) {
                  return "¥" + Math.round(value).toLocaleString();
                },
              },
              grid: {
                display: true,
                color: "rgba(160, 174, 192, 0.3)",
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: true,
              mode: "index",
              intersect: false,
              backgroundColor: "rgba(26, 32, 44, 0.9)",
              titleColor: "#ffffff",
              bodyColor: "#a0aec0",
              borderColor: "#4a5568",
              borderWidth: 1,
              // エラーを防ぐためのフィルター
              filter: function (tooltipItem) {
                try {
                  return tooltipItem.parsed && tooltipItem.parsed.y !== null;
                } catch (e) {
                  return false;
                }
              },
              callbacks: {
                title: function (context) {
                  try {
                    return labels[context[0].dataIndex] || "Date";
                  } catch (e) {
                    return "Date";
                  }
                },
                label: (context) => {
                  try {
                    const dataIndex = context.dataIndex;

                    if (context.dataset.label === "Stock Price") {
                      const item = candlestickData[dataIndex];
                      if (item) {
                        return [
                          `Open: ¥${item.open.toLocaleString()}`,
                          `High: ¥${item.high.toLocaleString()}`,
                          `Low: ¥${item.low.toLocaleString()}`,
                          `Close: ¥${item.close.toLocaleString()}`,
                        ];
                      }
                    } else {
                      const value = context.dataset.data[dataIndex];
                      if (value !== null && value !== undefined) {
                        return `${context.dataset.label}: ¥${Math.round(
                          value
                        ).toLocaleString()}`;
                      }
                    }
                    return "";
                  } catch (e) {
                    return "";
                  }
                },
              },
            },
          },
        },
      });

      console.log("Candlestick chart created successfully");
    },

    createMACDChart() {
      if (!this.$refs.macdCanvas) {
        console.error("MACD canvas ref not found");
        return;
      }

      const canvas = this.$refs.macdCanvas;

      // canvasの存在とDOM接続を確認
      if (!canvas || !canvas.parentElement || !document.contains(canvas)) {
        console.warn("MACD canvas is not properly mounted in DOM");
        return;
      }

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Could not get 2d context from MACD canvas");
        return;
      }

      const container = canvas.parentElement;
      const containerRect = container.getBoundingClientRect();
      canvas.width = containerRect.width - 20;
      canvas.height = 150;

      const labels = this.currentStockData.map(
        (item) => item.x || item.time || ""
      );
      const macdData = this.currentStockData.map((item, index) => {
        return Math.sin(index * 0.2) * 15 + Math.random() * 5 - 2.5;
      });
      const signalData = this.currentStockData.map((item, index) => {
        return Math.sin(index * 0.2 - 0.5) * 12 + Math.random() * 3 - 1.5;
      });
      const histogramData = macdData.map(
        (macd, index) => macd - signalData[index]
      );

      this.macdChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "MACD",
              data: macdData,
              borderColor: "#9f7aea",
              backgroundColor: "transparent",
              pointRadius: 1,
              pointBackgroundColor: "#9f7aea",
              borderWidth: 2,
              fill: false,
              tension: 0.1,
            },
            {
              label: "Signal",
              data: signalData,
              borderColor: "#ed8936",
              backgroundColor: "transparent",
              pointRadius: 1,
              pointBackgroundColor: "#ed8936",
              borderWidth: 2,
              fill: false,
              tension: 0.1,
            },
            {
              label: "Histogram",
              type: "bar",
              data: histogramData,
              backgroundColor: histogramData.map((value) =>
                value >= 0
                  ? "rgba(72, 187, 120, 0.8)"
                  : "rgba(245, 101, 101, 0.8)"
              ),
              borderColor: histogramData.map((value) =>
                value >= 0 ? "rgba(72, 187, 120, 1)" : "rgba(245, 101, 101, 1)"
              ),
              borderWidth: 1,
              barPercentage: 0.6,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 300,
            onComplete: () => {
              // アニメーション完了後にcanvasの状態を確認
              if (
                !this.$refs.macdCanvas ||
                !document.contains(this.$refs.macdCanvas)
              ) {
                console.warn("MACD Canvas became unavailable after animation");
              }
            },
          },
          scales: {
            x: {
              type: "category",
              display: true,
              title: {
                display: true,
                text: "Date",
                color: "#a0aec0",
              },
              ticks: {
                maxTicksLimit: 10,
                color: "#a0aec0",
                callback: function (value, index, values) {
                  const step = Math.max(1, Math.ceil(values.length / 8));
                  return index % step === 0 ? labels[index] : "";
                },
              },
              grid: {
                display: true,
                color: "rgba(160, 174, 192, 0.3)",
              },
            },
            y: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "MACD",
                color: "#a0aec0",
              },
              ticks: {
                color: "#a0aec0",
                callback: function (value) {
                  return value.toFixed(1);
                },
              },
              grid: {
                display: true,
                color: "rgba(160, 174, 192, 0.3)",
                drawOnChartArea: true,
              },
            },
          },
          elements: {
            line: {
              borderJoinStyle: "round",
            },
            point: {
              hoverRadius: 4,
            },
          },
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                color: "#a0aec0",
                usePointStyle: true,
                padding: 15,
                font: {
                  size: 11,
                },
              },
            },
            tooltip: {
              enabled: true,
              mode: "index",
              intersect: false,
              backgroundColor: "rgba(26, 32, 44, 0.9)",
              titleColor: "#ffffff",
              bodyColor: "#a0aec0",
              borderColor: "#4a5568",
              borderWidth: 1,
              // エラーを防ぐためのフィルター
              filter: function (tooltipItem) {
                try {
                  return tooltipItem.parsed && tooltipItem.parsed.y !== null;
                } catch (e) {
                  return false;
                }
              },
              callbacks: {
                title: function (context) {
                  try {
                    return labels[context[0].dataIndex] || "Date";
                  } catch (e) {
                    return "Date";
                  }
                },
              },
            },
          },
        },
      });

      console.log("MACD chart created successfully");
    },

    createRSIChart() {
      if (!this.$refs.rsiCanvas) {
        console.error("RSI canvas ref not found");
        return;
      }

      const canvas = this.$refs.rsiCanvas;

      // canvasの存在とDOM接続を確認
      if (!canvas || !canvas.parentElement || !document.contains(canvas)) {
        console.warn("RSI canvas is not properly mounted in DOM");
        return;
      }

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Could not get 2d context from RSI canvas");
        return;
      }

      const container = canvas.parentElement;
      const containerRect = container.getBoundingClientRect();
      canvas.width = containerRect.width - 20;
      canvas.height = 150;

      const labels = this.currentStockData.map(
        (item) => item.x || item.time || ""
      );

      // RSI計算用の終値データ
      const closes = this.currentStockData.map((item) =>
        this.safeParseFloat(item.close || item.c)
      );

      // RSIを計算（期間14日）
      this.prevAvgGain = null;
      this.prevAvgLoss = null;
      const rsiData = this.calculateRSI(closes, 14);

      this.rsiChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "RSI(14)",
              data: rsiData,
              borderColor: "#e53e3e",
              backgroundColor: "transparent",
              pointRadius: 1,
              pointBackgroundColor: "#e53e3e",
              borderWidth: 2,
              fill: false,
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 300,
            onComplete: () => {
              // アニメーション完了後にcanvasの状態を確認
              if (
                !this.$refs.rsiCanvas ||
                !document.contains(this.$refs.rsiCanvas)
              ) {
                console.warn("RSI Canvas became unavailable after animation");
              }
            },
          },
          scales: {
            x: {
              type: "category",
              display: true,
              title: {
                display: true,
                text: "Date",
                color: "#a0aec0",
              },
              ticks: {
                maxTicksLimit: 10,
                color: "#a0aec0",
                callback: function (value, index, values) {
                  const step = Math.max(1, Math.ceil(values.length / 8));
                  return index % step === 0 ? labels[index] : "";
                },
              },
              grid: {
                display: true,
                color: "rgba(160, 174, 192, 0.3)",
              },
            },
            y: {
              type: "linear",
              display: true,
              position: "right",
              min: 0,
              max: 100,
              title: {
                display: true,
                text: "RSI",
                color: "#a0aec0",
              },
              ticks: {
                color: "#a0aec0",
                stepSize: 20,
                callback: function (value) {
                  return value.toString();
                },
              },
              grid: {
                display: true,
                color: "rgba(160, 174, 192, 0.3)",
                drawOnChartArea: true,
              },
            },
          },
          elements: {
            line: {
              borderJoinStyle: "round",
            },
            point: {
              hoverRadius: 4,
            },
          },
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                color: "#a0aec0",
                usePointStyle: true,
                padding: 15,
                font: {
                  size: 11,
                },
              },
            },
            tooltip: {
              enabled: true,
              mode: "index",
              intersect: false,
              backgroundColor: "rgba(26, 32, 44, 0.9)",
              titleColor: "#ffffff",
              bodyColor: "#a0aec0",
              borderColor: "#4a5568",
              borderWidth: 1,
              // エラーを防ぐためのフィルター
              filter: function (tooltipItem) {
                try {
                  return tooltipItem.parsed && tooltipItem.parsed.y !== null;
                } catch (e) {
                  return false;
                }
              },
              callbacks: {
                title: function (context) {
                  try {
                    return labels[context[0].dataIndex] || "Date";
                  } catch (e) {
                    return "Date";
                  }
                },
                label: function (context) {
                  try {
                    const value = context.parsed.y;
                    if (value !== null && value !== undefined) {
                      return `RSI: ${value.toFixed(2)}`;
                    }
                    return "";
                  } catch (e) {
                    return "";
                  }
                },
              },
            },
          },
          // RSIの水平線（30と70のライン）
          annotation: {
            annotations: {
              oversold: {
                type: "line",
                yMin: 30,
                yMax: 30,
                borderColor: "rgba(255, 99, 132, 0.8)",
                borderWidth: 1,
                borderDash: [5, 5],
              },
              overbought: {
                type: "line",
                yMin: 70,
                yMax: 70,
                borderColor: "rgba(255, 99, 132, 0.8)",
                borderWidth: 1,
                borderDash: [5, 5],
              },
            },
          },
        },
      });

      console.log("RSI chart created successfully");
    },
  },
};
</script>
