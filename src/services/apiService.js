import axios from "axios";
import { buildApiUrl, logApiConfig } from "@/config/api.js";

// APIサービスクラス
class ApiService {
  constructor() {
    // デバッグ用：API設定をログ出力
    logApiConfig();
  }

  // 株価情報を取得
  async getStockInfo(code) {
    try {
      const url = buildApiUrl(`/stock/${code}`);
      console.log("Fetching stock info from:", url);

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching stock info:", error);
      throw error;
    }
  }

  // その他のAPIエンドポイント用のメソッドを追加可能
  // 例：
  // async getCompanyList() {
  //   const url = buildApiUrl('/companies');
  //   const response = await axios.get(url);
  //   return response.data;
  // }
}

// シングルトンインスタンスを作成
const apiService = new ApiService();

export default apiService;
