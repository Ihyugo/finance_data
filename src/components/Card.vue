<template>
  <div class="card card-place">
    <img class="card-img-top" />
    <div class="card-body">
      <h3 class="card-title">{{ msg }}</h3>
      <div v-if="brand_code">
        <h4 class="card-title">銘柄コード： {{ brand_code }}</h4>
      </div>
      <h4 class="card-text">最終更新日： {{ datetime }}</h4>
      <div v-if="value != null">
        <a
          :href="url"
          class="btn btn-primary"
          target="_blank"
          name="かぶたん"
          >{{ value }}</a
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CardMargin",
  props: {
    msg: String,
    brand_code: String,
    date: String,
    url: String,
    value: String,
  },
  data() {
    return {
      datetime: "",
    };
  },
  watch: {
    date: "dateTime",
  },

  mounted() {
    this.dateTime();
  },
  methods: {
    dateTime() {
      if (this.date == undefined) return null;
      this.datetime =
        this.date.slice(0, 4) +
        "/" +
        this.date.slice(4, 6) +
        "/" +
        this.date.slice(6);
    },
  },
};
</script>
<style scoped>
.card-place {
  width: 60%;
  margin: auto;
}
</style>
