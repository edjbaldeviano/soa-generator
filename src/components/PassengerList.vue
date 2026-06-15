<template>
  <div class="passenger-list">
    <div v-for="(_, i) in modelValue" :key="i" class="passenger-row">
      <label :for="`pax-${i}`">Passenger {{ i + 1 }}</label>
      <input
        :id="`pax-${i}`"
        :value="modelValue[i]"
        type="text"
        placeholder="LASTNAME/FIRSTNAME TITLE"
        @input="updateName(i, $event.target.value)"
      />
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
const emit = defineEmits(['update:modelValue'])

function updateName(i, value) {
  const next = [...props.modelValue]
  next[i] = value
  emit('update:modelValue', next)
}

function add() {
  emit('update:modelValue', [...props.modelValue, ''])
}

function remove(i) {
  emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
}
</script>
