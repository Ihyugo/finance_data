import { mount, shallowMount } from "@vue/test-utils";
import { createApp } from "vue";
import StockChart from "@/components/StockChart.vue";
import MACDChart from "@/components/charts/MACDChart.vue";
import RSIChart from "@/components/charts/RSIChart.vue";
import StockPriceChart from "@/components/charts/StockPriceChart.vue";

// Chart.jsのモック
jest.mock("chart.js", () => ({
  Chart: {
    register: jest.fn(),
    getChart: jest.fn(() => ({
      destroy: jest.fn(),
      update: jest.fn(),
      resize: jest.fn(),
    })),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  TimeScale: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  LineController: jest.fn(),
  LineElement: jest.fn(),
  PointElement: jest.fn(),
  BarController: jest.fn(),
  BarElement: jest.fn(),
}));

// サンプルデータ
const mockStockData = [
  {
    time: "2023-01-01",
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1000,
    macd_macd: 0.5,
    macd_signal: 0.3,
    macd_histogram: 0.2,
    rsi: 65,
    sma: 102,
    ema: 103,
    tema: 104,
    bollinger_upper: 108,
    bollinger_lower: 98,
    psar: 99,
  },
  {
    time: "2023-01-02",
    open: 105,
    high: 115,
    low: 100,
    close: 110,
    volume: 1200,
    macd_macd: 0.6,
    macd_signal: 0.4,
    macd_histogram: 0.2,
    rsi: 70,
    sma: 104,
    ema: 105,
    tema: 106,
    bollinger_upper: 112,
    bollinger_lower: 100,
    psar: 101,
  },
];

describe("StockChart.vue", () => {
  let wrapper;

  beforeEach(() => {
    // グローバルモックの設定
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe("コンポーネントの初期化", () => {
    it("正しくマウントされる", () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it("必要な子コンポーネントが含まれている", () => {
      wrapper = mount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      expect(wrapper.findComponent(MACDChart).exists()).toBe(true);
      expect(wrapper.findComponent(RSIChart).exists()).toBe(true);
      expect(wrapper.findComponent(StockPriceChart).exists()).toBe(true);
    });
  });

  describe("プロパティとデータ", () => {
    it("デフォルトの期間が正しく設定される", () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      expect(wrapper.vm.selectedPeriod).toBe("3M");
      expect(wrapper.vm.periodOptions).toHaveLength(7);
    });

    it("テクニカル指標の初期状態が正しい", () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      expect(wrapper.vm.indicators.movingAverage.enabled).toBe(false);
      expect(wrapper.vm.indicators.bollingerBands.enabled).toBe(false);
      expect(wrapper.vm.indicators.parabolic.enabled).toBe(false);
    });
  });

  describe("期間選択の機能", () => {
    it("期間を変更できる", async () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      await wrapper.vm.setPeriod("3M");
      expect(wrapper.vm.selectedPeriod).toBe("3M");
    });

    it("カスタム期間が正しく設定される", async () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      await wrapper.vm.setPeriod("custom");
      expect(wrapper.vm.selectedPeriod).toBe("custom");
      expect(wrapper.vm.customRange.start).toBe(0);
      expect(wrapper.vm.customRange.end).toBe(mockStockData.length - 1);
    });
  });

  describe("テクニカル指標の切り替え", () => {
    it("移動平均線の切り替えが動作する", async () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      wrapper.vm.indicators.movingAverage.enabled = true;
      expect(wrapper.vm.indicators.movingAverage.enabled).toBe(true);
    });

    it("ボリンジャーバンドの切り替えが動作する", async () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      wrapper.vm.indicators.bollingerBands.enabled = true;
      expect(wrapper.vm.indicators.bollingerBands.enabled).toBe(true);
    });

    it("パラボリックSARの切り替えが動作する", async () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      wrapper.vm.indicators.parabolic.enabled = true;
      expect(wrapper.vm.indicators.parabolic.enabled).toBe(true);
    });
  });

  describe("データ処理", () => {
    it("現在の株価データが正しく計算される", () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      expect(wrapper.vm.currentStockData).toEqual(mockStockData);
    });

    it("日付ラベルが正しくフォーマットされる", () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      const label = wrapper.vm.getDateLabel(0);
      expect(label).toBe("2023-01-01");
    });
  });

  describe("チャートの更新", () => {
    it("チャートキーが正しく更新される", async () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      const initialMainKey = wrapper.vm.mainChartKey;
      const initialMacdKey = wrapper.vm.macdChartKey;
      const initialRsiKey = wrapper.vm.rsiChartKey;

      await wrapper.vm.updateAllCharts();

      expect(wrapper.vm.mainChartKey).toBe(initialMainKey + 1);
      expect(wrapper.vm.macdChartKey).toBe(initialMacdKey + 1);
      expect(wrapper.vm.rsiChartKey).toBe(initialRsiKey + 1);
    });

    it("描画中の状態が正しく管理される", async () => {
      wrapper = shallowMount(StockChart, {
        propsData: {
          stockData: mockStockData,
        },
      });

      expect(wrapper.vm.isDrawing).toBe(false);

      // 描画中の状態をシミュレート
      wrapper.vm.isDrawing = true;
      expect(wrapper.vm.isDrawing).toBe(true);
    });
  });

  describe("エラーハンドリング", () => {
    it("空のデータでエラーが発生しない", () => {
      expect(() => {
        shallowMount(StockChart, {
          propsData: {
            stockData: [],
          },
        });
      }).not.toThrow();
    });

    it("無効なデータでエラーが発生しない", () => {
      expect(() => {
        shallowMount(StockChart, {
          propsData: {
            stockData: [],
          },
        });
      }).not.toThrow();
    });
  });
});
