export function chartData(flag, margin_data, fridays) {
  if (flag == "margin") {
    return {
      labels: fridays,
      datasets: [
        {
          label: "信用倍率",
          borderColor: "#000000",
          data: margin_data[0],
          yAxisID: "yaxis2",
          tension: 0,
        },
        {
          label: "信用売残",
          borderColor: "#4682b4",
          backgroundColor: "#4682b4",
          data: margin_data[1],
          yAxisID: "yaxis1",
          fill: true,
          tension: 0,
        },
        {
          label: "信用買残",
          borderColor: "#0000cd",
          backgroundColor: "#0000cd",
          data: margin_data[2],
          yAxisID: "yaxis1",
          fill: true,
          tension: 0,
        },
      ],
    };
  } else if (flag == "general") {
    return {
      labels: fridays,
      datasets: [
        {
          label: "一般信用倍率",
          borderColor: "#00ffff",
          data: margin_data[3],
          yAxisID: "yaxis2",
          tension: 0,
        },
        {
          label: "一般信用売残",
          borderColor: "#20b2aa",
          backgroundColor: "#20b2aa",
          data: margin_data[4],
          yAxisID: "yaxis1",
          fill: true,
          tension: 0,
        },
        {
          label: "一般信用買残",
          borderColor: "#008000",
          backgroundColor: "#008000",
          data: margin_data[5],
          yAxisID: "yaxis1",
          fill: true,
          tension: 0,
        },
      ],
    };
  } else if (flag == "system") {
    return {
      labels: fridays,
      datasets: [
        {
          label: "制度信用倍率",
          borderColor: "#8fbc8f",
          data: margin_data[6],
          yAxisID: "yaxis2",
          tension: 0,
        },
        {
          label: "制度信用売残",
          borderColor: "#7fff00",
          backgroundColor: "#7fff00",
          data: margin_data[7],
          yAxisID: "yaxis1",
          fill: true,
          tension: 0,
        },
        {
          label: "制度信用買残",
          borderColor: "#f87979",
          backgroundColor: "#f87979",
          data: margin_data[8],
          yAxisID: "yaxis1",
          fill: true,
          tension: 0,
        },
      ],
    };
  } else if (flag == "ratio") {
    return {
      labels: fridays,
      datasets: [
        {
          label: "信用倍率",
          borderColor: "#000000",
          data: margin_data[0],
          yAxisID: "yaxis1",
          tension: 0,
        },
        {
          label: "一般信用倍率",
          borderColor: "#00ffff",
          data: margin_data[3],
          yAxisID: "yaxis1",
          tension: 0,
        },
        {
          label: "制度信用倍率",
          borderColor: "#8fbc8f",
          data: margin_data[6],
          yAxisID: "yaxis1",
          tension: 0,
        },
      ],
    };
  }
}
