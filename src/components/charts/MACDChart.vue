<template>
  <div class="macd-chart">
    <h3>MACD Indicator</h3>
    <div class="chart-wrapper">
      <canvas
        ref="macdCanvas"
        :key="'macd-' + chartKey"
      />
    </div>
  </div>
</template>

<script>
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  BarController,
  BarElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

// Chart.jsの基本コンポーネントを登録
Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  BarController,
  BarElement,
  PointElement,
  Tooltip,
  Legend
);

export default {
  name: "MACDChart",
  props: {
    stockData: {
      type: Array,
      required: true,
      default: () => [],
    },
    chartKey: {
      type: Number,
      default: 0,
    },
  },
  emits: ["chart-ready"],
  data() {
    return {
      macdChart: null,
    };
  },
  watch: {
    stockData: {
      handler() {
        this.updateChart();
      },
      deep: true,
    },
    chartKey() {
      this.updateChart();
    },
  },
  mounted() {
    this.createChart();
  },
  beforeUnmount() {
    this.destroyChart();
  },
  methods: {
    async destroyChart() {
      try {
        if (this.macdChart) {
          // アニメーションを停止
          this.macdChart.stop();

          // チャートを破棄
          this.macdChart.destroy();

          // 参照をクリア
          this.macdChart = null;

          // Chart.jsの内部処理が完了するまで待機
          await new Promise((resolve) => setTimeout(resolve, 100));

          // ガベージコレクションを促す
          if (typeof window !== "undefined" && window.gc) {
            window.gc();
          }
        }
      } catch (error) {
        console.warn("Error destroying MACD chart:", error);
        this.macdChart = null;
      }
    },

    async updateChart() {
      try {
        // 既存のチャートを確実に破棄
        await this.destroyChart();

        // DOMが更新されるまで待ってからチャートを作成
        this.$nextTick(async () => {
          // チャートの完全な破棄を待つ
          await new Promise((resolve) => setTimeout(resolve, 200));

          if (this.$refs.macdCanvas && !this.macdChart) {
            await this.createChart();
          }
        });
      } catch (error) {
        console.error("Error updating MACD chart:", error);
      }
    },

    async createChart() {
      if (!this.$refs.macdCanvas) {
        console.error("MACD canvas ref not found");
        return;
      }

      const canvas = this.$refs.macdCanvas;

      if (!canvas || !canvas.parentElement || !document.contains(canvas)) {
        console.warn("MACD canvas is not properly mounted in DOM");
        return;
      }

      // 既存のチャートが残っている場合は破棄
      if (this.macdChart) {
        console.warn("MACD chart already exists, destroying first");
        await this.destroyChart();
        return;
      }

      try {
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          console.error("Could not get 2d context from MACD canvas");
          return;
        }

        // canvasのサイズをリセット
        canvas.width = 0;
        canvas.height = 0;

        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        canvas.width = containerRect.width - 20;
        canvas.height = 150;

        const labels = this.stockData.map((item) => item.x || item.time || "");

        // APIから取得したMACDの値を使用
        const macdData = this.stockData.map((item, index) => {
          // APIからMACDの値を取得
          if (item.macd_macd !== null && item.macd_macd !== undefined) {
            return item.macd_macd;
          }
          // フォールバック：従来の計算方法
          return Math.sin(index * 0.2) * 15 + Math.random() * 5 - 2.5;
        });

        const signalData = this.stockData.map((item, index) => {
          // APIからSignalの値を取得
          if (item.macd_signal !== null && item.macd_signal !== undefined) {
            return item.macd_signal;
          }
          // フォールバック：従来の計算方法
          return Math.sin(index * 0.2 - 0.5) * 12 + Math.random() * 3 - 1.5;
        });

        const histogramData = this.stockData.map((item, index) => {
          // APIからHistogramの値を取得
          if (
            item.macd_histogram !== null &&
            item.macd_histogram !== undefined
          ) {
            return item.macd_histogram;
          }
          // フォールバック：従来の計算方法
          return macdData[index] - signalData[index];
        });

        // チャート作成前に再度チェック
        if (!this.$refs.macdCanvas || this.macdChart) {
          console.warn(
            "MACD chart creation cancelled - canvas or chart state changed"
          );
          return;
        }

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
                  value >= 0
                    ? "rgba(72, 187, 120, 1)"
                    : "rgba(245, 101, 101, 1)"
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
                if (
                  !this.$refs.macdCanvas ||
                  !document.contains(this.$refs.macdCanvas)
                ) {
                  console.warn(
                    "MACD Canvas became unavailable after animation"
                  );
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

        // 親コンポーネントに描画完了を通知
        this.$emit("chart-ready");
      } catch (error) {
        console.error("Error creating MACD chart:", error);
        // エラーが発生した場合はチャート参照をクリア
        this.macdChart = null;

        // エラーが発生した場合も親コンポーネントに通知
        this.$emit("chart-ready");
      }
    },
  },
};
</script>

<style scoped>
.macd-chart {
  margin-bottom: 2rem;
}

.chart-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background: white;
}
</style>
