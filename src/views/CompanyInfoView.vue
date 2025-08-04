<template>
  <div class="about">
    <CompanyInfo />
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
    this.code = this.$route.query.code;
  },
};
</script>
