<template>
  <div class="tab-navigation">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tab-button', { active: activeTab === tab.id }]"
      @click="$emit('tab-change', tab.id)"
    >
      <i :class="tab.icon" />
      {{ tab.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: "TabNavigation",
  props: {
    tabs: {
      type: Array,
      required: true,
      // tabs: [{ id: String, label: String, icon: String }]
    },
    activeTab: {
      type: String,
      required: true,
    },
  },
  emits: ["tab-change"],
};
</script>

<style scoped>
.tab-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.tab-button:hover {
  color: #374151;
  background: #f9fafb;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: #eff6ff;
}

.tab-button i {
  font-size: 1.1rem;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .tab-navigation {
    gap: 0.25rem;
  }

  .tab-button {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .tab-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .tab-button i {
    display: none;
  }
}
</style>
