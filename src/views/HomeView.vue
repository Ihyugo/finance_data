<template>
  <div class="home">
    <MainTableVue msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
// @ is an alias to /src
import MainTableVue from "@/components/MainTable.vue";

export default {
  name: "HomeView",
  components: {
    MainTableVue,
  },
};
</script>
