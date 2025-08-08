<template>
  <div>
    <CardMargin :date="date" msg="銘柄別信用取引情報" />
    <br />

    <div class="main-table">
      <div class="middle-desc">
        <hr />
        <br />
        <div
          class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3"
        >
          <h1 class="h2">個別銘柄 信用取引情報</h1>
          <div style="width: 400px">
            <v-select
              v-model="typeValues"
              :items="typeOptions"
              label="銘柄の種類選択"
              chips
              multiple
            ></v-select>
          </div>

          <div style="width: 400px">
            <v-select
              v-model="marketValues"
              :items="marketOptions"
              label="市場の選択"
              chips
              multiple
            ></v-select>
          </div>
          <v-btn
            class="icon-button"
            :disabled="loading"
            @click="downloadCSVFile()"
          >
            <csv_icon />
          </v-btn>
          <v-btn class="icon-button" @click="dialog = true">
            <gear_icon />
          </v-btn>
        </div>
      </div>
      <hr />
      <br />
      <div class="scroll-table">
        <!-- 検索フィールド -->
        <v-text-field
          clearable
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="検索"
        />
        <!-- データテーブル -->
        <v-data-table
          class="elevation-1"
          :loading="loading"
          :items="data"
          :headers="headers"
          :sort-by="sortBy"
          multi-sort
          :custom-filter="customFilter"
          :search="search"
          item-value="security_code"
          height="1000"
          width="150%"
          fixed-header
          @click:row="handleClick"
          calculate-widths="false"
          items-per-page="50"
          mobile-breakpoint="800"
        ></v-data-table>
      </div>
    </div>
    <div>
      <v-dialog v-model="dialog" width="800px" scrollable>
        <v-card prepend-icon="mdi-earth" title="非表示にする列を選択">
          <v-divider class="mt-3"></v-divider>

          <v-card-text>
            <v-autocomplete
              :items="headers"
              label="何も選択しない場合すべての列が表示されます"
              auto-select-first
              multiple
              v-model="selected"
            ></v-autocomplete>

            <small class="text-caption text-medium-emphasis"
              >非表示にする列を選択できます</small
            >
          </v-card-text>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script>
import firestore from "@/firestore.js";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getHeader } from "./calculation/header_data";
import { downloadCSV } from "./calculation/download_csv";
import CardMargin from "./Card.vue";
import csv_icon from "./icon/csv_icon.vue";
import gear_icon from "./icon/gear_icon.vue";

const db = firestore.db;

export default {
  components: { CardMargin, csv_icon, gear_icon },
  name: "MainTable",
  props: {
    msg: String,
  },
  data() {
    // ストレージから初期データを取得
    const getStoredValue = (key, defaultValue) => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    };
    const ori_type_values = getStoredValue("typeValues", ["margin"]);
    const ori_market_values = getStoredValue("marketValues", ["Prime"]);
    const ori_search = localStorage.getItem("search") || "";
    const selected = getStoredValue("selected", []);

    return {
      loading: false,
      typeValues: ori_type_values,
      typeOptions: [
        { title: "貸借銘柄 loan trading issue", value: "margin" },
        {
          title: "制度信用銘柄 standardized margin trading issue",
          value: "system",
        },
        { title: "その他 other issues", value: "other" },
      ],
      marketValues: ori_market_values,
      marketOptions: [
        { title: "プライム Prime sub-total", value: "Prime" },
        {
          title: "スタンダード Standard sub-total",
          value: "Standard",
        },
        { title: "グロース Growth sub-total", value: "Groth" },
        { title: "投信等 Investment trusts sub-total", value: "Investment" },
      ],
      search: ori_search,
      sortBy: [],
      date: "",
      headers: "",
      data: [],
      dialog: false,
      selected: selected,
    };
  },
  mounted() {
    this.getLastUpdate();
  },
  watch: {
    date: "readData",
    typeValues: function (val) {
      localStorage.setItem("typeValues", JSON.stringify(val));
      this.readData();
    },
    marketValues: function (val) {
      localStorage.setItem("marketValues", JSON.stringify(val));
      this.readData();
    },
    search: function (newval) {
      if (!newval) newval = "";
      localStorage.setItem("search", newval);
    },
    selected: function () {
      this.dialogData();
    },
  },
  methods: {
    async getLastUpdate() {
      const q = query(
        collection(db, "LastUpdate"),
        orderBy("date", "desc"),
        limit(1)
      );
      const date = await getDocs(q);
      date.forEach((d) => {
        this.date = d.data().date;
      });
    },
    async getData() {
      console.log("get data");
      const sub = await getDocs(collection(db, "data"));
      sub.forEach((doc) => {
        this.data.push(doc.data());
      });
      console.log("data length: " + this.data.length);
      localStorage.setItem("data", JSON.stringify(this.data));
      localStorage.setItem("date", this.date);
      this.itemfilter();
    },
    readData() {
      console.log("mounted");
      if (!window.localStorage) {
        this.getData();
        return null;
      }

      const localDate = localStorage.getItem("date");
      const jsonData = localStorage.getItem("data");
      this.dialogData();

      if (localDate != this.date || jsonData == null || localDate == null) {
        this.getData();
        return null;
      }

      this.data = JSON.parse(jsonData);
      this.itemfilter();
      this.data.forEach((val) => {
        if (val.credit_multipiler === null) val.credit_multipiler = Infinity;
        if (val.general_credit_multipiler === null)
          val.general_credit_multipiler = Infinity;
        if (val.system_credit_multipiler === null)
          val.system_credit_multipiler = Infinity;
      });
    },
    itemfilter() {
      let filteredData = this.data;
      filteredData = filteredData.filter((value) => {
        if (
          this.typeValues.includes(value.type) &&
          this.marketValues.includes(value.market)
        )
          return value;
      });
      this.data = filteredData;
      return null;
    },
    recollectData() {
      console.log("recollect");
      localStorage.removeItem("date");
      localStorage.removeItem("data");
      window.location.reload();
      return null;
    },
    handleClick(_, row) {
      const tab = this.$router.resolve({
        name: "company-info",
        query: {
          security_code: row.item.security_code,
          code: row.item.code,
        },
      });
      window.open(tab.href, "_blank");
      return null;
    },
    downloadCSVFile() {
      downloadCSV(this.data, this.date);
      return null;
    },
    toFullWidth(str) {
      // 半角英数字を全角に変換
      if (str == null) {
        return "";
      }
      str = str
        .split("")
        .map((char) => {
          const code = char.charCodeAt(0);
          // 半角英数字と記号を全角に変換
          if (code >= 33 && code <= 126) {
            let fullWidthChar = String.fromCharCode(code + 0xfee0);
            // 英数字を大文字に変換
            if (code >= 97 && code <= 122) {
              // a-z
              fullWidthChar = String.fromCharCode(code - 32 + 0xfee0);
            } else if (code >= 65 && code <= 90) {
              // A-Z
              fullWidthChar = String.fromCharCode(code + 0xfee0);
            } else if (code >= 48 && code <= 57) {
              // 0-9
              fullWidthChar = String.fromCharCode(code + 0xfee0);
            }
            return fullWidthChar;
          }
          // 全角のアルファベット小文字を全角のアルファベット大文字に変換
          if (code >= 0xff41 && code <= 0xff5a) {
            return String.fromCharCode(code - 0x20);
          }
          return char;
        })
        .join("");

      str = str.replace(/[０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
      });
      return str;
    },
    dialogData() {
      const header = getHeader("main");
      let new_headers = [];
      header.forEach((nh) => {
        if (!this.selected.includes(nh["title"])) {
          new_headers.push(nh);
        }
      });
      this.headers = new_headers;
      localStorage.setItem("selected", JSON.stringify(this.selected));
      return null;
    },
    customFilter(value, search, item) {
      // 検索対象のカラムを限定
      if (value == null || search == null) return true;
      const search_word = this.toFullWidth(search);
      const brand_name = this.toFullWidth(item.columns.brand_name);
      const result =
        brand_name.indexOf(search_word) !== -1 ||
        item.columns.code.indexOf(search_word) !== -1;
      return result;
    },
  },
};
</script>

<style scoped>
.main-table {
  width: 100%;
  margin: auto;
}
.middle-desc {
  width: 80%;
  margin: auto;
}
.icon-button {
  height: 60px;
  width: 30px;
  margin-top: auto;
  margin-bottom: auto;
  box-shadow: none;
}
.scroll-table {
  width: auto;
  overflow-x: auto;
}
.select-container {
  width: 400px;
}
</style>
