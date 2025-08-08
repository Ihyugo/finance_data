export function getHeader(page) {
  const main = [
    {
      title: "証券コード",
      key: "code",
      width: "160px",
    },
    {
      title: "銘柄名",
      key: "brand_name",
      width: "250px",
    },
    {
      title: "信用倍率",
      key: "credit_multipiler",
      width: "100px",
    },
    {
      title: "信用売残",
      key: "total_unsold",
      width: "100px",
    },
    {
      title: "信用売残前週比",
      key: "total_unsold_ratio",
      width: "100px",
    },
    {
      title: "信用買残",
      key: "total_remain_purchase",
      width: "100px",
    },
    {
      title: "信用買残前週比",
      key: "total_remain_purchase_ratio",
      width: "100px",
    },
    { title: "一般信用倍率", key: "general_credit_multipiler", width: "100px" },
    {
      title: "一般信用売残",
      key: "general_unsold",
      width: "100px",
    },
    {
      title: "一般信用売残前週比",
      key: "general_unsold_ratio",
      width: "100px",
    },
    {
      title: "一般信用買残",
      key: "general_remain_purchase",
      width: "100px",
    },
    {
      title: "一般信用買残前週比",
      key: "general_remain_purchase_ratio",
      width: "100px",
    },
    { title: "制度信用倍率", key: "system_credit_multipiler", width: "100px" },
    {
      title: "制度信用売残",
      key: "system_unsold",
      width: "100px",
    },
    { title: "制度信用売残前週比", key: "system_unsold_ratio", width: "100px" },
    {
      title: "制度信用買残",
      key: "system_remain_purchase",
      width: "100px",
    },
    {
      title: "制度信用買残前週比",
      key: "system_remain_purchase_ratio",
      width: "100px",
    },
  ];
  if (page == "about") {
    main.shift();
    main.shift();
    main.forEach((e) => {
      e["sortable"] = false;
    });
    main.unshift({
      title: "日付",
      key: "date",
      width: "100px",
    });
  }
  return main;
}
