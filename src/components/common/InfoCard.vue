<template>
  <div
    class="info-card"
    :class="{ 'full-width': fullWidth }"
  >
    <h3>{{ title }}</h3>
    <div class="info-list">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="info-item"
      >
        <span class="label">{{ item.label }}</span>
        <span
          class="value"
          v-text="item.value"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "InfoCard",
  props: {
    title: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      required: true,
      // items: [{ label: String, value: String }]
    },
    fullWidth: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.info-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.info-card.full-width {
  grid-column: 1 / -1;
}

.info-card h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #6b7280;
  font-weight: 500;
  font-size: 0.9rem;
}

.info-item .value {
  color: #1f2937;
  font-weight: 600;
  text-align: right;
}
</style>
