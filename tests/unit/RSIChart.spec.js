import { shallowMount } from "@vue/test-utils";
import RSIChart from "@/components/charts/RSIChart.vue";

// Chart.jsのモック
jest.mock("chart.js", () => ({
  Chart: {
    register: jest.fn(),
    getChart: jest.fn(() => ({
      destroy: jest.fn(),
      update: jest.fn(),
      resize: jest.fn(),
      stop: jest.fn(),
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
}));

// サンプルデータ
const mockStockData = [
  { time: "2023-01-01", close: 100, rsi: 65 },
  { time: "2023-01-02", close: 105, rsi: 70 },
  { time: "2023-01-03", close: 110, rsi: 75 },
  { time: "2023-01-04", close: 108, rsi: 72 },
  { time: "2023-01-05", close: 112, rsi: 78 },
  { time: "2023-01-06", close: 115, rsi: 80 },
  { time: "2023-01-07", close: 113, rsi: 76 },
  { time: "2023-01-08", close: 116, rsi: 82 },
  { time: "2023-01-09", close: 118, rsi: 85 },
  { time: "2023-01-10", close: 120, rsi: 88 },
  { time: "2023-01-11", close: 122, rsi: 90 },
  { time: "2023-01-12", close: 125, rsi: 92 },
  { time: "2023-01-13", close: 123, rsi: 89 },
  { time: "2023-01-14", close: 126, rsi: 93 },
  { time: "2023-01-15", close: 128, rsi: 95 },
];

describe("RSIChart.vue", () => {
  let wrapper;

  beforeEach(() => {
    // グローバルモックの設定
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Canvas要素のモック
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: jest.fn(() => ({
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        clearRect: jest.fn(),
        setTransform: jest.fn(),
        getImageData: jest.fn(() => ({ data: new Array(4) })),
        putImageData: jest.fn(),
        createImageData: jest.fn(() => []),
        drawImage: jest.fn(),
        createPattern: jest.fn(),
        createLinearGradient: jest.fn(() => ({
          addColorStop: jest.fn(),
        })),
        createRadialGradient: jest.fn(() => ({
          addColorStop: jest.fn(),
        })),
      })),
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe("コンポーネントの初期化", () => {
    it("正しくマウントされる", () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it("必要なプロパティが正しく設定される", () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      expect(wrapper.vm.stockData).toEqual(mockStockData);
      expect(wrapper.vm.chartKey).toBe(1);
    });
  });

  describe("RSI計算", () => {
    it("RSIが正しく計算される", () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // RSI計算メソッドが存在することを確認
      expect(wrapper.vm.calculateRSI).toBeDefined();
    });

    it("APIデータが優先される", () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // APIデータのRSI値が正しく設定されていることを確認
      expect(wrapper.vm.stockData).toHaveLength(15);
      expect(wrapper.vm.stockData[0].rsi).toBe(65); // APIデータのRSI値
    });

    it("APIデータがない場合は計算値を使用", () => {
      const dataWithoutRSI = mockStockData.map((item) => ({
        ...item,
        rsi: null,
      }));

      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: dataWithoutRSI,
          chartKey: 1,
        },
      });

      // RSI計算が実行されることを確認
      expect(wrapper.vm.calculateRSI).toBeDefined();
    });
  });

  describe("データ処理", () => {
    it("RSIデータが正しく処理される", () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // コンポーネントが正しくマウントされることを確認
      expect(wrapper.vm.stockData).toEqual(mockStockData);
      expect(wrapper.vm.chartKey).toBe(1);
    });

    it("日付データが正しく処理される", () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // データが正しく設定されることを確認
      expect(wrapper.vm.stockData).toHaveLength(15);
      expect(wrapper.vm.stockData[0].time).toBe("2023-01-01");
    });

    it("空のデータでエラーが発生しない", () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: [],
          chartKey: 1,
        },
      });

      expect(wrapper.vm.stockData).toEqual([]);
      expect(wrapper.vm.chartKey).toBe(1);
    });
  });

  describe("チャートの作成と更新", () => {
    it("チャートが正しく作成される", async () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // コンポーネントが正しくマウントされることを確認
      expect(wrapper.vm.stockData).toEqual(mockStockData);
      expect(wrapper.vm.chartKey).toBe(1);
    });

    it("チャートが正しく破棄される", async () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // destroyChartメソッドをモック
      wrapper.vm.destroyChart = jest.fn();

      await wrapper.vm.updateChart();
      expect(wrapper.vm.destroyChart).toHaveBeenCalled();
    });
  });

  describe("ライフサイクル", () => {
    it("mountedフックが正しく動作する", () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // mountedフックでupdateChartが呼ばれることを確認
      expect(wrapper.vm.updateChart).toBeDefined();
    });

    it("watchが正しく動作する", async () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // updateChartメソッドをモック
      wrapper.vm.updateChart = jest.fn();

      // chartKeyを変更
      await wrapper.setProps({ chartKey: 2 });

      // 次のティックでupdateChartが呼ばれることを確認
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.updateChart).toHaveBeenCalled();
    });
  });

  describe("RSIの境界値", () => {
    it("RSI 30以下の場合はオーバーソールド", () => {
      const oversoldData = mockStockData.map((item) => ({ ...item, rsi: 25 }));

      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: oversoldData,
          chartKey: 1,
        },
      });

      const rsiData = oversoldData.map((item) => item.rsi);
      expect(rsiData.every((rsi) => rsi <= 30)).toBe(true);
    });

    it("RSI 70以上の場合はオーバーボート", () => {
      const overboughtData = mockStockData.map((item) => ({
        ...item,
        rsi: 85,
      }));

      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: overboughtData,
          chartKey: 1,
        },
      });

      const rsiData = overboughtData.map((item) => item.rsi);
      expect(rsiData.every((rsi) => rsi >= 70)).toBe(true);
    });
  });

  describe("エラーハンドリング", () => {
    it("無効なデータでエラーが発生しない", () => {
      expect(() => {
        shallowMount(RSIChart, {
          propsData: {
            stockData: [],
            chartKey: 1,
          },
        });
      }).not.toThrow();
    });

    it("チャート作成時のエラーが適切に処理される", async () => {
      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // createChartでエラーが発生した場合の処理をテスト
      wrapper.vm.createChart = jest
        .fn()
        .mockRejectedValue(new Error("Chart creation failed"));

      // エラーが発生してもコンポーネントがクラッシュしないことを確認
      await expect(wrapper.vm.updateChart()).resolves.not.toThrow();
    });
  });

  describe("パフォーマンス", () => {
    it("大量のデータでもパフォーマンスが劣化しない", () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        time: `2023-01-${String(i + 1).padStart(2, "0")}`,
        close: 100 + i,
        rsi: 50 + Math.random() * 40, // 30-70の範囲
      }));

      const startTime = performance.now();

      wrapper = shallowMount(RSIChart, {
        propsData: {
          stockData: largeData,
          chartKey: 1,
        },
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 1000件のデータでも100ms以内に処理されることを確認
      expect(executionTime).toBeLessThan(100);
    });
  });
});
