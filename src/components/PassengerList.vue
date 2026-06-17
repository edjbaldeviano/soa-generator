<template>
  <div class="passenger-list">
    <div v-for="(pax, i) in modelValue" :key="i" class="passenger-row">
      <label>Passenger {{ i + 1 }}</label>
      <div class="passenger-fields">
        <input
          :id="`pax-last-${i}`"
          :value="pax.lastName"
          type="text"
          placeholder="LAST NAME"
          class="pax-last"
          @input="updateField(i, 'lastName', $event.target.value)"
        />
        <span class="pax-sep">/</span>
        <input
          :id="`pax-first-${i}`"
          :value="pax.firstName"
          type="text"
          placeholder="FIRST NAME"
          class="pax-first"
          @input="updateField(i, 'firstName', $event.target.value)"
        />
        <select
          :value="pax.label"
          class="pax-label"
          @change="updateField(i, 'label', $event.target.value)"
        >
          <option value="">--</option>
          <option>MR</option>
          <option>MRS</option>
          <option>MS</option>
          <option>MSTR</option>
          <option>DR</option>
          <option>INF</option>
          <option>CHD</option>
        </select>
      </div>
      <button
        v-if="modelValue.length > 1"
        type="button"
        class="btn-remove"
        @click="remove(i)"
      >
        ×
      </button>
    </div>
    <button type="button" class="btn-add" @click="add">+ Add Passenger</button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'remove', 'add'])

function updateField(i, field, value) {
  const next = [...props.modelValue]
  next[i] = { ...props.modelValue[i], [field]: value }
  emit('update:modelValue', next)
}

function add() {
  emit('update:modelValue', [...props.modelValue, { lastName: '', firstName: '', label: 'MR' }])
  emit('add')
}

function remove(i) {
  emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
  emit('remove', i)
}
</script>
