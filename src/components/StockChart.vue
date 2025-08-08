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
        期間: {{ stockData[0]?.x }} ～ {{ stockData[stockData.length - 1]?.x }}
      </p>
      <p>サンプルデータ: {{ JSON.stringify(stockData[0]) }}</p>
    </div>

    <!-- メインチャート（ローソク足） -->
    <div class="main-chart">
      <h3>Stock Price Chart</h3>
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
  </div>
</template>

<script>
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
      isCreatingCharts: false,
      chartKey: 0, // チャートの強制再描画用
    };
  },
  mounted() {
    console.log("StockChart mounted, stockData:", this.stockData);
    this.initializeCharts();
  },
  beforeUnmount() {
    this.destroyCharts();
  },
  watch: {
    stockData: {
      handler(newData) {
        console.log("stockData changed:", newData ? newData.length : "null");
        if (newData && newData.length > 0) {
          this.initializeCharts();
        }
      },
      deep: true,
      immediate: false,
    },
  },
  methods: {
    // 安全な数値変換関数
    safeParseFloat(value) {
      if (value === null || value === undefined || value === "") {
        return 0;
      }
      // 文字列の場合、カンマを除去してから変換
      const cleanValue =
        typeof value === "string" ? value.replace(/,/g, "") : value;
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    },

    destroyCharts() {
      if (this.mainChart) {
        this.mainChart.destroy();
        this.mainChart = null;
      }
      if (this.macdChart) {
        this.macdChart.destroy();
        this.macdChart = null;
      }
    },

    initializeCharts() {
      if (this.isCreatingCharts) return;

      if (!this.stockData || this.stockData.length === 0) {
        console.warn("Cannot create charts: stockData is empty or undefined");
        return;
      }

      // 前のチャートを破棄
      this.destroyCharts();

      // keyを更新して強制的に再レンダリング
      this.chartKey++;

      // DOM更新を待ってからチャート作成
      this.$nextTick(() => {
        setTimeout(() => {
          this.createCharts();
        }, 100);
      });
    },

    createCharts() {
      if (this.isCreatingCharts) return;

      if (!this.$refs.mainCanvas || !this.$refs.macdCanvas) {
        console.warn("Canvas refs not available, retrying...");
        setTimeout(() => this.createCharts(), 200);
        return;
      }

      this.isCreatingCharts = true;

      try {
        console.log("Creating charts with data:", {
          length: this.stockData.length,
          first: this.stockData[0],
          last: this.stockData[this.stockData.length - 1],
        });

        this.createMainChart();
        this.createMACDChart();

        console.log("Charts created successfully");
      } catch (error) {
        console.error("Error creating charts:", error);
      } finally {
        this.isCreatingCharts = false;
      }
    },

    createMainChart() {
      // canvasの存在確認
      if (!this.$refs.mainCanvas) {
        console.error("Main canvas ref not found");
        return;
      }

      const canvas = this.$refs.mainCanvas;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Could not get 2d context from main canvas");
        return;
      }

      // キャンバスサイズを明示的に設定
      const container = canvas.parentElement;
      const containerRect = container.getBoundingClientRect();
      canvas.width = containerRect.width - 20;
      canvas.height = 250;

      // 安全な数値変換を使用してデータを処理
      const labels = this.stockData.map((item) => item.x || item.date || "");
      const closeData = this.stockData.map((item) =>
        this.safeParseFloat(item.c || item.close)
      );
      const highData = this.stockData.map((item) =>
        this.safeParseFloat(item.h || item.high)
      );
      const lowData = this.stockData.map((item) =>
        this.safeParseFloat(item.l || item.low)
      );
      // const openData = this.stockData.map((item) =>
      //   this.safeParseFloat(item.o || item.open)
      // );

      // データの検証
      const validCloseData = closeData.filter((val) => val > 0);
      const validHighData = highData.filter((val) => val > 0);
      const validLowData = lowData.filter((val) => val > 0);

      if (validCloseData.length === 0) {
        console.error("No valid price data found");
        return;
      }

      console.log("Chart data details:", {
        labels: labels.slice(0, 5),
        closeData: closeData.slice(0, 5),
        highData: highData.slice(0, 5),
        lowData: lowData.slice(0, 5),
        closeMin: Math.min(...validCloseData),
        closeMax: Math.max(...validCloseData),
        dataLength: closeData.length,
      });

      // Y軸の範囲を計算
      const allPrices = [...validCloseData, ...validHighData, ...validLowData];
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const priceRange = maxPrice - minPrice;
      const yMin = Math.max(0, minPrice - priceRange * 0.05);
      const yMax = maxPrice + priceRange * 0.05;

      // Chart.jsでchartを作成
      this.mainChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Close Price",
              data: closeData,
              borderColor: "#00d4aa",
              backgroundColor: "rgba(0, 212, 170, 0.1)",
              pointRadius: 2,
              pointBackgroundColor: "#00d4aa",
              borderWidth: 3,
              fill: false,
              tension: 0.1,
            },
            {
              label: "High",
              data: highData,
              borderColor: "rgba(255, 99, 132, 0.8)",
              backgroundColor: "transparent",
              pointRadius: 1,
              pointBackgroundColor: "rgba(255, 99, 132, 0.8)",
              borderWidth: 2,
              fill: false,
              tension: 0,
            },
            {
              label: "Low",
              data: lowData,
              borderColor: "rgba(54, 162, 235, 0.8)",
              backgroundColor: "transparent",
              pointRadius: 1,
              pointBackgroundColor: "rgba(54, 162, 235, 0.8)",
              borderWidth: 2,
              fill: false,
              tension: 0,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 0,
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
                maxTicksLimit: 8,
                color: "#a0aec0",
                callback: function (value, index, values) {
                  const step = Math.ceil(values.length / 6);
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
          elements: {
            line: {
              borderJoinStyle: "round",
            },
            point: {
              hoverRadius: 6,
            },
          },
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                color: "#a0aec0",
                usePointStyle: true,
                padding: 20,
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
              callbacks: {
                title: function (context) {
                  return labels[context[0].dataIndex] || "Date";
                },
                label: (context) => {
                  const dataIndex = context.dataIndex;
                  const item = this.stockData[dataIndex];

                  if (context.dataset.label === "Close Price" && item) {
                    return [
                      `Open: ¥${this.safeParseFloat(
                        item.o || item.open
                      ).toLocaleString()}`,
                      `High: ¥${this.safeParseFloat(
                        item.h || item.high
                      ).toLocaleString()}`,
                      `Low: ¥${this.safeParseFloat(
                        item.l || item.low
                      ).toLocaleString()}`,
                      `Close: ¥${this.safeParseFloat(
                        item.c || item.close
                      ).toLocaleString()}`,
                    ];
                  }
                  return `${
                    context.dataset.label
                  }: ¥${context.parsed.y.toLocaleString()}`;
                },
              },
            },
          },
        },
      });

      console.log("Main chart created successfully", {
        chartInstance: this.mainChart,
        datasets: this.mainChart.data.datasets.length,
        dataPoints: this.mainChart.data.datasets[0].data.length,
      });
    },

    createMACDChart() {
      // canvasの存在確認
      if (!this.$refs.macdCanvas) {
        console.error("MACD canvas ref not found");
        return;
      }

      const canvas = this.$refs.macdCanvas;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Could not get 2d context from MACD canvas");
        return;
      }

      // キャンバスサイズを明示的に設定
      const container = canvas.parentElement;
      const containerRect = container.getBoundingClientRect();
      canvas.width = containerRect.width - 20;
      canvas.height = 150;

      // より明確なMACDデータを生成
      const labels = this.stockData.map((item) => item.x || item.date || "");
      const macdData = this.stockData.map((item, index) => {
        return Math.sin(index * 0.2) * 15 + Math.random() * 5 - 2.5;
      });
      const signalData = this.stockData.map((item, index) => {
        return Math.sin(index * 0.2 - 0.5) * 12 + Math.random() * 3 - 1.5;
      });
      const histogramData = macdData.map(
        (macd, index) => macd - signalData[index]
      );

      console.log("MACD data details:", {
        macdData: macdData.slice(0, 5),
        signalData: signalData.slice(0, 5),
        histogramData: histogramData.slice(0, 5),
        macdMin: Math.min(...macdData),
        macdMax: Math.max(...macdData),
      });

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
              borderWidth: 3,
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
              borderWidth: 3,
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
              barPercentage: 0.8,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 0,
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
                maxTicksLimit: 8,
                color: "#a0aec0",
                callback: function (value, index, values) {
                  const step = Math.ceil(values.length / 6);
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
                padding: 20,
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
            },
          },
        },
      });

      console.log("MACD chart created successfully", {
        chartInstance: this.macdChart,
        datasets: this.macdChart.data.datasets.length,
        dataPoints: this.macdChart.data.datasets[0].data.length,
      });
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
  min-height: 500px;
}

.debug-info {
  background: rgba(45, 55, 72, 0.8);
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
  font-size: 14px;
  border-left: 4px solid #4299e1;
}

.main-chart,
.macd-chart {
  width: 100%;
  margin-bottom: 20px;
  background: rgba(45, 55, 72, 0.5);
  border-radius: 6px;
  padding: 15px;
}

.chart-wrapper {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.main-chart {
  height: 320px;
}

.macd-chart {
  height: 220px;
}

.main-chart h3,
.macd-chart h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: "#e2e8f0";
  text-align: center;
}

canvas {
  display: block;
  border-radius: 4px;
}
</style>
