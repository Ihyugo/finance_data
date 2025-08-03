<template>
  <div class="pl-4">
    <ul>
      <li v-for="(value, key) in data" :key="key">
        {{ key }}
        {{value}}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "RecursiveViewer",
  props: {
    data: Object,
  },
  methods: {
    formatValue(value) {
        console.log(value);
      if (typeof value === 'number') {
        return value.toLocaleString();
      } else if (typeof value === 'string' && value.startsWith('http')) {
        return `<a href="${value}" target="_blank">${value}</a>`;
      }
      return value;
    },
  },
};
</script>

<style scoped>
ul {
  list-style: none;
  padding-left: 1em;
}

li {
  margin-bottom: 0.5em;
}
</style>
