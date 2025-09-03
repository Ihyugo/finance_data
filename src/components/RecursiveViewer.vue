<template>
  <div class="pl-4">
    <table>
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(value, key) in data"
          :key="key"
        >
          <td>{{ key }}</td>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <td v-html="formatValue(value)" />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "RecursiveViewer",
  props: {
    data: {
      type: Object,
      default: () => ({})
    },
  },
  methods: {
    formatValue(value) {
      console.log(value);
      if (typeof value === "number") {
        return value.toLocaleString();
      } else if (typeof value === "string" && value.startsWith("http")) {
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
