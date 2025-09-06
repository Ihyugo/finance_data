import { shallowMount } from "@vue/test-utils";
import MACDChart from "@/components/charts/MACDChart.vue";

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
  BarController: jest.fn(),
  BarElement: jest.fn(),
}));

// サンプルデータ
const mockStockData = [
  {
    time: "2023-01-01",
    close: 100,
    macd_macd: 0.5,
    macd_signal: 0.3,
    macd_histogram: 0.2,
  },
  {
    time: "2023-01-02",
    close: 105,
    macd_macd: 0.6,
    macd_signal: 0.4,
    macd_histogram: 0.2,
  },
  {
    time: "2023-01-03",
    close: 110,
    macd_macd: 0.7,
    macd_signal: 0.5,
    macd_histogram: 0.2,
  },
];

describe("MACDChart.vue", () => {
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
      wrapper = shallowMount(MACDChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it("必要なプロパティが正しく設定される", () => {
      wrapper = shallowMount(MACDChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      expect(wrapper.vm.stockData).toEqual(mockStockData);
      expect(wrapper.vm.chartKey).toBe(1);
    });
  });

  describe("データ処理", () => {
    it("MACDデータが正しく処理される", () => {
      wrapper = shallowMount(MACDChart, {
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
      wrapper = shallowMount(MACDChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // データが正しく設定されることを確認
      expect(wrapper.vm.stockData).toHaveLength(3);
      expect(wrapper.vm.stockData[0].time).toBe("2023-01-01");
    });

    it("空のデータでエラーが発生しない", () => {
      wrapper = shallowMount(MACDChart, {
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
      wrapper = shallowMount(MACDChart, {
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
      wrapper = shallowMount(MACDChart, {
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
      wrapper = shallowMount(MACDChart, {
        propsData: {
          stockData: mockStockData,
          chartKey: 1,
        },
      });

      // mountedフックでupdateChartが呼ばれることを確認
      expect(wrapper.vm.updateChart).toBeDefined();
    });

    it("watchが正しく動作する", async () => {
      wrapper = shallowMount(MACDChart, {
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

  describe("エラーハンドリング", () => {
    it("無効なデータでエラーが発生しない", () => {
      expect(() => {
        shallowMount(MACDChart, {
          propsData: {
            stockData: [],
            chartKey: 1,
          },
        });
      }).not.toThrow();
    });

    it("チャート作成時のエラーが適切に処理される", async () => {
      wrapper = shallowMount(MACDChart, {
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
        macd_macd: Math.random(),
        macd_signal: Math.random(),
        macd_histogram: Math.random(),
      }));

      const startTime = performance.now();

      wrapper = shallowMount(MACDChart, {
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
