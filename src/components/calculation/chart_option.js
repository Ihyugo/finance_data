export function chartOption(type, min_date = null, max_date = null) {
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    stroke: {
      curve: "smooth",
    },
    fill: {
      type: "solid",
      opacity: [0.35, 1],
    },
    markers: {
      size: 0,
    },
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    hover: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        type: "time",
        min: min_date,
        max: max_date,
        time: {
          unit: "month",
          stepSize: 1, // 3ヶ月ごとにメモリを表示
          // unit: "day",
          displayFormats: {
            month: "YYYY/MM",
          },
          tooltipFormat: "YYYY/MM/DD",
        },
      },
    },
  };

  if (type === "margin") {
    return {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        yaxis1: {
          title: {
            display: true,
            text: "買い残・売り残(株)",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          position: "left",
          type: "linear",
        },
        yaxis2: {
          title: {
            display: true,
            text: "信用倍率",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          position: "right",
          type: "linear",
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    };
  } else if (type === "ratio") {
    return {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        yaxis1: {
          title: {
            display: true,
            text: "信用倍率",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          position: "left",
          type: "linear",
        },
      },
    };
  }

  return commonOptions;
}
