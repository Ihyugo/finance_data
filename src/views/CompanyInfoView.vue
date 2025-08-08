<template>
  <div class="about">
    <CompanyInfo :code="code" />
  </div>
</template>

<script>
import CompanyInfo from "@/components/CompanyInfo.vue";

export default {
  name: "CompanyInfoView",
  components: {
    CompanyInfo,
  },
  data() {
    return {
      security_code: "",
      type: "",
      market: "",
      brand: "",
      code: "",
    };
  },
  created() {
    this.security_code = this.$route.query.security_code;
    const ori_code = this.$route.query.code;
    // 末尾の１文字を.Tに置き換える
    this.code = ori_code.slice(0, ori_code.length - 1) + ".T";
  },
};
</script>
