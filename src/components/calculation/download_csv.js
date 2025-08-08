export function downloadCSV(items, name) {
  let csv =
    "\ufeff" +
    "日付,証券コード,銘柄名,信用倍率,信用売残,信用売残前週比,信用買残,信用買残前週比,一般信用倍率,一般信用売残,一般信用売残前週比,一般信用買残,一般信用買残前週比,制度信用倍率,制度信用売残,制度信用売残前週比,制度信用買残,制度信用買残前週比\n";
  items.forEach((el) => {
    let line =
      el["date"] +
      "," +
      el["code"] +
      "," +
      el["brand_name"] +
      "," +
      el["credit_multipiler"] +
      "," +
      el["total_unsold"] +
      "," +
      el["total_unsold_ratio"] +
      "," +
      el["total_remain_purchase"] +
      "," +
      el["total_remain_purchase_ratio"] +
      "," +
      el["general_credit_multipiler"] +
      "," +
      el["general_unsold"] +
      "," +
      el["general_unsold_ratio"] +
      "," +
      el["general_remain_purchase"] +
      "," +
      el["general_remain_purchase_ratio"] +
      "," +
      el["system_credit_multipiler"] +
      "," +
      el["system_unsold"] +
      "," +
      el["system_unsold_ratio"] +
      "," +
      el["system_remain_purchase"] +
      "," +
      el["system_remain_purchase_ratio"] +
      "," +
      "\n";
    csv += line;
  });
  let blob = new Blob([csv], { type: "text/csv" });
  let link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = "margin_" + name + ".csv";
  link.click();
}
