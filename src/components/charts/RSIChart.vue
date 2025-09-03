<template>
  <div class="rsi-chart">
    <h3>RSI Indicator</h3>
    <div class="chart-wrapper">
      <canvas
        ref="rsiCanvas"
        :key="'rsi-' + chartKey"
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
  PointElement,
  Tooltip,
  Legend
);

export default {
  name: "RSIChart",
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
      rsiChart: null,
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
        if (this.rsiChart) {
          // アニメーションを停止
          this.rsiChart.stop();

          // チャートを破棄
          this.rsiChart.destroy();

          // 参照をクリア
          this.rsiChart = null;

          // Chart.jsの内部処理が完了するまで待機
          await new Promise((resolve) => setTimeout(resolve, 100));

          // ガベージコレクションを促す
          if (typeof window !== "undefined" && window.gc) {
            window.gc();
          }
        }
      } catch (error) {
        console.warn("Error destroying RSI chart:", error);
        this.rsiChart = null;
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

          if (this.$refs.rsiCanvas && !this.rsiChart) {
            await this.createChart();
          }
        });
      } catch (error) {
        console.error("Error updating RSI chart:", error);
      }
    },

    // RSIの計算
    calculateRSI(data, period = 14) {
      if (data.length < period + 1) {
        return new Array(data.length).fill(null);
      }

      const result = [];
      const gains = [];
      const losses = [];

      // 価格変化を計算
      for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
      }

      // 最初のperiod個は計算できないのでnull
      for (let i = 0; i < period; i++) {
        result.push(null);
      }

      // 最初のRSI計算：単純平均
      let avgGain =
        gains.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
      let avgLoss =
        losses.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

      // 最初のRSI値を計算
      let rsi;
      if (avgLoss === 0) {
        rsi = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi = 100 - 100 / (1 + rs);
      }
      result.push(rsi);

      // 以降のRSI値を指数移動平均で計算
      for (let i = period; i < gains.length; i++) {
        // 新しい価格変化を取得
        const currentGain = gains[i];
        const currentLoss = losses[i];

        // 指数移動平均を更新
        avgGain = (avgGain * (period - 1) + currentGain) / period;
        avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

        // RSIを計算
        if (avgLoss === 0) {
          rsi = 100;
        } else {
          const rs = avgGain / avgLoss;
          rsi = 100 - 100 / (1 + rs);
        }
        result.push(rsi);
      }

      return result;
    },

    async createChart() {
      if (!this.$refs.rsiCanvas) {
        console.error("RSI canvas ref not found");
        return;
      }

      const canvas = this.$refs.rsiCanvas;

      if (!canvas || !canvas.parentElement || !document.contains(canvas)) {
        console.warn("RSI canvas is not properly mounted in DOM");
        return;
      }

      // 既存のチャートが残っている場合は破棄
      if (this.rsiChart) {
        console.warn("RSI chart already exists, destroying first");
        await this.destroyChart();
        return;
      }

      try {
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          console.error("Could not get 2d context from RSI canvas");
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

        // RSI計算用の終値データ
        const closes = this.stockData
          .map((item) => {
            if (item === null || item === undefined || item === "") {
              return null;
            }

            let value;
            if (typeof item === "object") {
              // オブジェクトの場合はcloseプロパティを取得
              value = item.close || item.c;
            } else {
              // 直接の値の場合
              value = item;
            }

            if (value === null || value === undefined || value === "") {
              return null;
            }

            const cleanValue =
              typeof value === "string" ? value.replace(/,/g, "") : value;
            const parsed = parseFloat(cleanValue);

            if (isNaN(parsed) || parsed <= 0) {
              return null;
            }

            return parsed;
          })
          .filter((val) => val !== null); // null値を除外

        // RSIを計算（期間14日）
        let rsiData;
        if (closes.length < 15) {
          console.warn(
            "Insufficient data for RSI calculation, need at least 15 data points"
          );
          rsiData = new Array(this.stockData.length).fill(null);
        } else {
          // APIから取得したRSIの値を使用
          const apiRsiData = this.stockData.map((item) => item.rsi);
          const hasApiRsi = apiRsiData.some(
            (val) => val !== null && val !== undefined
          );

          if (hasApiRsi) {
            // APIからRSIの値を取得
            rsiData = apiRsiData;
            console.log("Using API RSI data");
          } else {
            // フォールバック：従来の計算方法
            rsiData = this.calculateRSI(closes, 14);
            console.log("Using calculated RSI data");
          }

          // デバッグ用：RSIデータの確認
          console.log("RSI calculation debug:", {
            dataLength: closes.length,
            rsiDataLength: rsiData.length,
            rsiRange: {
              min: Math.min(...rsiData.filter((v) => v !== null)),
              max: Math.max(...rsiData.filter((v) => v !== null)),
            },
            sampleValues: rsiData.slice(0, 20), // 最初の20個の値を確認
            source: hasApiRsi ? "API" : "Calculated",
          });
        }

        // チャート作成前に再度チェック
        if (!this.$refs.rsiCanvas || this.rsiChart) {
          console.warn(
            "RSI chart creation cancelled - canvas or chart state changed"
          );
          return;
        }

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
          },
        });

        console.log("RSI chart created successfully");

        // 親コンポーネントに描画完了を通知
        this.$emit("chart-ready");
      } catch (error) {
        console.error("Error creating RSI chart:", error);
        // エラーが発生した場合はチャート参照をクリア
        this.rsiChart = null;

        // エラーが発生した場合も親コンポーネントに通知
        this.$emit("chart-ready");
      }
    },
  },
};
</script>

<style scoped>
.rsi-chart {
  margin-bottom: 2rem;
}

.chart-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background: white;
}
</style>
