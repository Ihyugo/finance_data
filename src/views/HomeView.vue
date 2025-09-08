<template>
  <div class="home">
    <!-- ヒーローセクション -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="gradient-text">金融データ分析</span>
        </h1>
        <p class="hero-subtitle">
          リアルタイムで株式市場の信用取引情報を分析・可視化
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <div class="stat-number">
              {{ totalStocks }}
            </div>
            <div class="stat-label">
              銘柄数
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-number">
              {{ lastUpdate }}
            </div>
            <div class="stat-label">
              最終更新
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-number">
              {{ marketCount }}
            </div>
            <div class="stat-label">
              市場数
            </div>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="floating-cards">
          <div class="floating-card card-1" />
          <div class="floating-card card-2" />
          <div class="floating-card card-3" />
        </div>
      </div>
    </div>

    <!-- メインコンテンツ -->
    <div class="main-content">
      <!-- 検索・フィルターセクション -->
      <div class="filter-section">
        <v-card
          class="filter-card"
          elevation="2"
        >
          <v-card-title class="filter-title">
            <v-icon class="mr-2">
              mdi-filter-variant
            </v-icon>
            データフィルター
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                cols="12"
                md="4"
              >
                <v-select
                  v-model="typeValues"
                  :items="typeOptions"
                  label="銘柄の種類"
                  chips
                  multiple
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-select
                  v-model="marketValues"
                  :items="marketOptions"
                  label="市場の選択"
                  chips
                  multiple
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-text-field
                  v-model="search"
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  label="銘柄名・証券コード検索"
                  variant="outlined"
                  density="comfortable"
                  placeholder="例: トヨタ（銘柄名）、7203（証券コード）"
                />
              </v-col>
            </v-row>
            <div class="filter-actions">
              <v-btn
                color="primary"
                variant="elevated"
                prepend-icon="mdi-download"
                :disabled="loading"
                @click="downloadCSVFile()"
              >
                CSVダウンロード
              </v-btn>
              <v-btn
                color="secondary"
                variant="outlined"
                prepend-icon="mdi-cog"
                @click="dialog = true"
              >
                表示設定
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- データテーブルセクション -->
      <div class="table-section">
        <v-card
          class="table-card"
          elevation="2"
        >
          <v-card-title class="table-title">
            <v-icon class="mr-2">
              mdi-table
            </v-icon>
            個別銘柄 信用取引情報
            <v-spacer />
            <v-chip
              color="primary"
              variant="tonal"
            >
              {{ filteredData.length }} 件
            </v-chip>
          </v-card-title>
          <v-card-text class="pa-0">
            <div class="data-table-container">
              <v-data-table
                class="modern-table"
                :loading="loading"
                :items="filteredData"
                :headers="headers"
                :sort-by="sortBy"
                multi-sort
                item-value="security_code"
                height="600"
                fixed-header
                calculate-widths="false"
                items-per-page="25"
                mobile-breakpoint="800"
                @click:row="handleClick"
              >
                <template #item.code="{ item }">
                  <v-chip
                    color="primary"
                    variant="tonal"
                    size="small"
                  >
                    {{ item.code }}
                  </v-chip>
                </template>
                <template #item.brand_name="{ item }">
                  <div class="brand-name">
                    <strong>{{ item.brand_name }}</strong>
                  </div>
                </template>
                <template #item.credit_multipiler="{ item }">
                  <v-chip
                    :color="getCreditMultiplierColor(item.credit_multipiler)"
                    variant="tonal"
                    size="small"
                  >
                    {{ formatCreditMultiplier(item.credit_multipiler) }}
                  </v-chip>
                </template>
                <template #item.market="{ item }">
                  <v-chip
                    :color="getMarketColor(item.market)"
                    variant="tonal"
                    size="small"
                  >
                    {{ item.market }}
                  </v-chip>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- 設定ダイアログ -->
    <v-dialog
      v-model="dialog"
      width="600px"
      scrollable
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">
            mdi-cog
          </v-icon>
          表示設定
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-autocomplete
            v-model="selected"
            :items="allHeaders"
            label="非表示にする列を選択"
            multiple
            chips
            variant="outlined"
          />
          <v-alert
            type="info"
            variant="tonal"
            class="mt-3"
          >
            選択した列は非表示になります。何も選択しない場合、すべての列が表示されます。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="dialog = false"
          >
            閉じる
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import firestore from "@/firestore.js";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getHeader } from "@/components/calculation/header_data";
import { downloadCSV } from "@/components/calculation/download_csv";

const db = firestore.db;

export default {
  name: "HomeView",
  data() {
    const getStoredValue = (key, defaultValue) => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    };

    return {
      loading: false,
      typeValues: getStoredValue("typeValues", ["margin"]),
      typeOptions: [
        { title: "貸借銘柄", value: "margin" },
        { title: "制度信用銘柄", value: "system" },
        { title: "その他", value: "other" },
      ],
      marketValues: getStoredValue("marketValues", ["Prime"]),
      marketOptions: [
        { title: "プライム", value: "Prime" },
        { title: "スタンダード", value: "Standard" },
        { title: "グロース", value: "Growth" },
        { title: "投信等", value: "Investment" },
      ],
      search: localStorage.getItem("search") || "",
      sortBy: [],
      date: "",
      headers: [],
      allHeaders: [],
      data: [],
      filteredData: [],
      dialog: false,
      selected: getStoredValue("selected", []),
    };
  },
  computed: {
    totalStocks() {
      return this.data.length.toLocaleString();
    },
    lastUpdate() {
      if (!this.date) return "--";
      return (
        this.date.slice(0, 4) +
        "/" +
        this.date.slice(4, 6) +
        "/" +
        this.date.slice(6)
      );
    },
    marketCount() {
      return new Set(this.data.map((item) => item.market)).size;
    },
  },
  watch: {
    date: "readData",
    typeValues: {
      handler(val) {
        localStorage.setItem("typeValues", JSON.stringify(val));
        this.filterData();
      },
      deep: true,
    },
    marketValues: {
      handler(val) {
        localStorage.setItem("marketValues", JSON.stringify(val));
        this.filterData();
      },
      deep: true,
    },
    search: function (newval) {
      localStorage.setItem("search", newval || "");
      this.filterData();
    },
    selected: {
      handler() {
        this.updateHeaders();
      },
      deep: true,
    },
    data: {
      handler() {
        this.filterData();
      },
      deep: true,
    },
  },
  mounted() {
    this.getLastUpdate();
    // 初期データ読み込み
    this.$nextTick(() => {
      this.readData();
    });
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
      this.loading = true;
      try {
        const sub = await getDocs(collection(db, "data"));
        this.data = [];
        sub.forEach((doc) => {
          this.data.push(doc.data());
        });
        localStorage.setItem("data", JSON.stringify(this.data));
        localStorage.setItem("date", this.date);
        this.updateHeaders();
        this.filterData();
      } finally {
        this.loading = false;
      }
    },
    readData() {
      if (!window.localStorage) {
        this.getData();
        return;
      }

      const localDate = localStorage.getItem("date");
      const jsonData = localStorage.getItem("data");

      if (localDate !== this.date || !jsonData || !localDate) {
        this.getData();
        return;
      }

      this.data = JSON.parse(jsonData);
      this.updateHeaders();
      this.filterData();
    },
    updateHeaders() {
      const header = getHeader("main");
      this.allHeaders = header.map((h) => h.title);

      let newHeaders = [];
      header.forEach((nh) => {
        if (!this.selected.includes(nh.title)) {
          newHeaders.push(nh);
        }
      });
      this.headers = newHeaders;
      localStorage.setItem("selected", JSON.stringify(this.selected));
    },
    filterData() {
      let filtered = this.data;

      // タイプフィルター（配列が空の場合は全て除外）
      if (this.typeValues.length === 0) {
        filtered = [];
      } else {
        filtered = filtered.filter((item) =>
          this.typeValues.includes(item.type)
        );
      }

      // 市場フィルター（配列が空の場合は全て除外）
      if (this.marketValues.length === 0) {
        filtered = [];
      } else {
        filtered = filtered.filter((item) =>
          this.marketValues.includes(item.market)
        );
      }

      // 検索フィルター
      if (this.search) {
        filtered = filtered.filter((item) =>
          this.customFilter(null, this.search, item)
        );
      }

      this.filteredData = filtered;
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
    },
    downloadCSVFile() {
      downloadCSV(this.filteredData, this.date);
    },
    customFilter(value, search, item) {
      if (!search) return true;

      // 数字か文字列かを判定（半角・全角数字）
      const isNumeric = /^[0-9０-９]+$/.test(search);

      if (isNumeric) {
        // 数字の場合：半角に変換して証券コードでパターンマッチ
        const searchCode = search.replace(/[０-９]/g, (s) =>
          String.fromCharCode(s.charCodeAt(0) - 0xfee0)
        );
        const code = item.code || "";
        // 証券コード検索：入力した数字を含む証券コードを検索
        return code.indexOf(searchCode) !== -1;
      } else {
        // 文字列の場合：全角に変換して銘柄名でパターンマッチ
        const searchWord = this.toFullWidth(search);
        const brandName = item.brand_name || "";
        return brandName.indexOf(searchWord) !== -1;
      }
    },
    toFullWidth(str) {
      if (!str) return "";
      return str
        .split("")
        .map((char) => {
          const code = char.charCodeAt(0);
          if (code >= 33 && code <= 126) {
            return String.fromCharCode(code + 0xfee0);
          }
          return char;
        })
        .join("");
    },
    getCreditMultiplierColor(value) {
      if (value === null || value === Infinity) return "grey";
      if (value >= 3) return "success";
      if (value >= 2) return "warning";
      return "error";
    },
    formatCreditMultiplier(value) {
      if (value === null || value === Infinity) return "制限なし";
      return value.toFixed(1);
    },
    getMarketColor(market) {
      const colors = {
        Prime: "primary",
        Standard: "secondary",
        Groth: "success",
        Investment: "info",
      };
      return colors[market] || "default";
    },
  },
};
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* ヒーローセクション */
.hero-section {
  padding: 80px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  color: white;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(45deg, #fff, #e3f2fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-stats {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

.hero-visual {
  flex: 1;
  position: relative;
  height: 300px;
}

.floating-cards {
  position: relative;
  width: 100%;
  height: 100%;
}

.floating-card {
  position: absolute;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: float 6s ease-in-out infinite;
}

.card-1 {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.card-2 {
  top: 50%;
  right: 20%;
  animation-delay: 2s;
}

.card-3 {
  bottom: 20%;
  left: 50%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* メインコンテンツ */
.main-content {
  background: #f8fafc;
  padding: 40px 20px;
  min-height: calc(100vh - 400px);
}

.filter-section,
.table-section {
  max-width: 1200px;
  margin: 0 auto 30px;
}

.filter-card,
.table-card {
  border-radius: 16px;
  overflow: hidden;
}

.filter-title,
.table-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.data-table-container {
  border-radius: 0 0 16px 16px;
  overflow: hidden;
}

.modern-table {
  background: white;
}

.modern-table :deep(.v-data-table__wrapper) {
  border-radius: 0;
}

.brand-name {
  font-weight: 500;
  color: #1a202c;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding: 60px 20px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-stats {
    justify-content: center;
    gap: 1.5rem;
  }

  .hero-visual {
    height: 200px;
    margin-top: 2rem;
  }

  .filter-actions {
    flex-direction: column;
  }

  .filter-actions .v-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .main-content {
    padding: 20px 10px;
  }
}
</style>
