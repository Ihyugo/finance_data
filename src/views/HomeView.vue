<template>
  <div class="home">
    {{ msg }}
  </div>
</template>

<script>
// @ is an alias to /src

export default {
  name: "HomeView",
  props: {
    msg: String,
  },
};
</script>
