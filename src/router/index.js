import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import CompanyInfoView from "@/views/CompanyInfoView.vue";
import NotFound from "@/views/NotFound.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/company-info",
    name: "company-info",
    component: CompanyInfoView,
  },
  {
    path: "/error", // ワイルドカードで全ての未定義ルートをキャッチ
    name: "NotFound",
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
