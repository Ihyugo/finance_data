<template>
  <div class="main-chart">
    <h3>Stock Price Chart (Candlestick)</h3>
    <div class="chart-wrapper">
      <canvas
        ref="mainCanvas"
        :key="'main-' + chartKey"
      />
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
  name: "StockPriceChart",
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
    indicators: {
      type: Object,
      default: () => ({
        movingAverage: { enabled: false, periods: [5, 25, 75] },
        bollingerBands: {
          enabled: false,
          period: 20,
          multipliers: [1, 2, 3, 4],
        },
        parabolic: { enabled: false, step: 0.02, maximum: 0.2 },
      }),
    },
  },
  emits: ["chart-ready"],
  data() {
    return {
      mainChart: null,
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
    indicators: {
      handler() {
        this.updateChart();
      },
      deep: true,
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
        if (this.mainChart) {
          // アニメーションを停止
          this.mainChart.stop();

          // チャートを破棄
          this.mainChart.destroy();

          // 参照をクリア
          this.mainChart = null;

          // Chart.jsの内部処理が完了するまで待機
          await new Promise((resolve) => setTimeout(resolve, 100));

          // ガベージコレクションを促す
          if (typeof window !== "undefined" && window.gc) {
            window.gc();
          }
        }
      } catch (error) {
        console.warn("Error destroying main chart:", error);
        this.mainChart = null;
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

          if (this.$refs.mainCanvas && !this.mainChart) {
            await this.createChart();
          }
        });
      } catch (error) {
        console.error("Error updating chart:", error);
      }
    },

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

    async createChart() {
      if (!this.$refs.mainCanvas) {
        console.error("Main canvas ref not found");
        return;
      }

      const canvas = this.$refs.mainCanvas;

      if (!canvas || !canvas.parentElement || !document.contains(canvas)) {
        console.warn("Canvas is not properly mounted in DOM");
        return;
      }

      // 既存のチャートが残っている場合は破棄
      if (this.mainChart) {
        console.warn("Chart already exists, destroying first");
        await this.destroyChart();
        return;
      }

      try {
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          console.error("Could not get 2d context from main canvas");
          return;
        }

        // canvasのサイズをリセット
        canvas.width = 0;
        canvas.height = 0;

        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        canvas.width = containerRect.width - 20;
        canvas.height = 300;

        // ローソク足用のデータ構造を作成
        const labels = this.stockData.map((item) => item.x || item.time || "");
        const candlestickData = this.stockData.map((item) => ({
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
          console.log("Adding Moving Average indicators");

          // APIから取得可能な移動平均線の値を確認
          const availableMAs = {
            sma: this.stockData.map((item) => item.sma),
            ema: this.stockData.map((item) => item.ema),
            wma: this.stockData.map((item) => item.wma),
            hma: this.stockData.map((item) => item.hma),
            tema: this.stockData.map((item) => item.tema),
            trima: this.stockData.map((item) => item.trima),
            dema: this.stockData.map((item) => item.dema),
          };

          console.log("Available Moving Averages from API:", {
            sma: availableMAs.sma.filter((v) => v !== null).length,
            ema: availableMAs.ema.filter((v) => v !== null).length,
            wma: availableMAs.wma.filter((v) => v !== null).length,
            hma: availableMAs.hma.filter((v) => v !== null).length,
            tema: availableMAs.tema.filter((v) => v !== null).length,
            trima: availableMAs.trima.filter((v) => v !== null).length,
            dema: availableMAs.dema.filter((v) => v !== null).length,
          });

          this.indicators.movingAverage.periods.forEach((period, index) => {
            // APIから取得した移動平均線の値を使用
            let maData;
            if (period === 5) {
              maData = this.stockData.map((item) => item.sma || null);
              console.log(`MA5 (SMA) data:`, maData.slice(0, 5));
            } else if (period === 25) {
              maData = this.stockData.map((item) => item.ema || null);
              console.log(`MA25 (EMA) data:`, maData.slice(0, 5));
            } else if (period === 75) {
              // 75日移動平均は利用できない場合が多いので、TEMA（Triple EMA）を使用
              maData = this.stockData.map((item) => item.tema || null);
              console.log(`MA75 (TEMA) data:`, maData.slice(0, 5));
            } else {
              // フォールバック：従来の計算方法
              maData = this.calculateMovingAverage(closes, period);
              console.log(`MA${period} (calculated) data:`, maData.slice(0, 5));
            }

            const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1"];
            datasets.push({
              label: `MA${period}`,
              type: "line",
              data: maData,
              borderColor: colors[index],
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
          console.log("Adding Bollinger Bands indicators");

          // APIから取得可能な移動平均（middle）を確認
          const apiMiddle = this.stockData.map(
            (item) => item.sma || item.ema || null
          );
          const hasApiMiddle = apiMiddle.some((val) => val !== null);

          this.indicators.bollingerBands.multipliers.forEach(
            (multiplier, index) => {
              let bb;

              if (hasApiMiddle) {
                // APIからmiddleを取得し、upper/lowerを計算
                console.log(`Using API middle for BB${multiplier}σ`);
                console.log(
                  `計算期間: ${this.indicators.bollingerBands.period}日、最小期間: 2日から開始`
                );

                const upper = [];
                const lower = [];

                for (let i = 0; i < this.stockData.length; i++) {
                  // 最小期間（2日）から計算開始
                  const minPeriod = Math.min(
                    2,
                    this.indicators.bollingerBands.period
                  );

                  if (i < minPeriod - 1) {
                    // 最小期間分のデータが不足している場合はnull
                    // Day1は計算不可
                    upper.push(null);
                    lower.push(null);
                  } else {
                    // 利用可能な最大期間でデータを取得
                    // Day3: 3日分、Day4: 4日分、...、Day20以降: 20日分
                    const availablePeriod = Math.min(
                      i + 1,
                      this.indicators.bollingerBands.period
                    );
                    const periodData = closes.slice(
                      i - availablePeriod + 1,
                      i + 1
                    );
                    const middle = apiMiddle[i];

                    if (middle !== null && periodData.length >= minPeriod) {
                      // 標準偏差を計算（利用可能な期間で）
                      // 例：Day3では3日分のデータで標準偏差を計算
                      let sum = 0;
                      for (let j = 0; j < periodData.length; j++) {
                        sum += Math.pow(periodData[j] - middle, 2);
                      }
                      const stdDev = Math.sqrt(sum / periodData.length);

                      // 各σの値を計算
                      upper.push(middle + stdDev * multiplier);
                      lower.push(middle - stdDev * multiplier);

                      // デバッグ用ログ（最初の数日分）
                      if (i < 10) {
                        console.log(
                          `Day${i + 1}: period=${
                            periodData.length
                          }, middle=${middle}, stdDev=${stdDev.toFixed(
                            2
                          )}, upper=${(middle + stdDev * multiplier).toFixed(
                            2
                          )}, lower=${(middle - stdDev * multiplier).toFixed(
                            2
                          )}`
                        );
                      }
                    } else {
                      upper.push(null);
                      lower.push(null);
                    }
                  }
                }

                bb = { upper, lower, middle: apiMiddle };
                console.log(`BB${multiplier}σ with API middle:`, {
                  upper: upper.slice(0, 5),
                  lower: lower.slice(0, 5),
                  middle: apiMiddle.slice(0, 5),
                  multiplier: multiplier,
                });
              } else {
                // APIからmiddleが取得できない場合は従来の計算方法
                console.log(`Calculating BB${multiplier}σ from scratch`);
                bb = this.calculateBollingerBands(
                  closes,
                  this.indicators.bollingerBands.period,
                  multiplier
                );
                console.log(`BB${multiplier}σ calculated:`, {
                  upper: bb.upper.slice(0, 5),
                  lower: bb.lower.slice(0, 5),
                  middle: bb.middle.slice(0, 5),
                });
              }

              const colors = [
                "rgba(255, 206, 84, 0.3)",
                "rgba(54, 162, 235, 0.3)",
                "rgba(255, 99, 132, 0.3)",
                "rgba(75, 192, 192, 0.3)",
              ];

              datasets.push({
                label: `BB+${multiplier}σ`,
                type: "line",
                data: bb.upper,
                borderColor: colors[index].replace("0.3", "0.8"),
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
                borderColor: colors[index].replace("0.3", "0.8"),
                backgroundColor: colors[index],
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
          console.log("Adding Parabolic SAR indicator");
          // APIから取得したパラボリックSARの値を使用
          const apiSarData = this.stockData.map((item) => item.psar);
          const hasApiSar = apiSarData.some(
            (val) => val !== null && val !== undefined
          );

          console.log("Parabolic SAR API data:", apiSarData.slice(0, 5));

          let sarData;
          if (hasApiSar) {
            sarData = apiSarData;
            console.log("Using API Parabolic SAR data");
          } else {
            // フォールバック：従来の計算方法
            console.log("Calculating Parabolic SAR from price data");
            sarData = this.calculateParabolicSAR(highs, lows, closes);
            console.log(
              "Calculated Parabolic SAR sample:",
              sarData.slice(0, 5)
            );
          }

          datasets.push({
            label: "Parabolic SAR",
            type: "line",
            data: sarData,
            borderColor: "#ff9500",
            backgroundColor: "#ff9500",
            pointRadius: 2,
            pointBackgroundColor: "#ff9500",
            borderWidth: 0,
            fill: false,
            showLine: false,
          });
        }

        // チャート作成前に再度チェック
        if (!this.$refs.mainCanvas || this.mainChart) {
          console.warn(
            "Chart creation cancelled - canvas or chart state changed"
          );
          return;
        }

        console.log("Creating chart with datasets:", {
          totalDatasets: datasets.length,
          datasetLabels: datasets.map((ds) => ds.label),
          candlestickDataLength: candlestickData.length,
        });

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

        // 親コンポーネントに描画完了を通知
        this.$emit("chart-ready");
      } catch (error) {
        console.error("Error creating chart:", error);
        console.error("Error details:", {
          stockDataLength: this.stockData?.length,
          indicators: this.indicators,
          errorMessage: error.message,
          errorStack: error.stack,
        });

        // エラーが発生した場合はチャート参照をクリア
        this.mainChart = null;

        // エラーが発生した場合も親コンポーネントに通知
        this.$emit("chart-ready");
      }
    },
  },
};
</script>

<style scoped>
.main-chart {
  margin-bottom: 2rem;
}

.chart-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background: white;
}
</style>
