<template>
  <div class="route-input">
    <!-- Route type toggle -->
    <div class="toggle-group route-type-group">
      <label
        v-for="opt in ROUTE_TYPES"
        :key="opt.value"
        class="toggle-label"
        :class="{ active: modelValue.type === opt.value }"
      >
        <input
          type="radio"
          :value="opt.value"
          :checked="modelValue.type === opt.value"
          @change="changeType(opt.value)"
        />
        {{ opt.label }}
      </label>
    </div>

    <!-- Airport inputs -->
    <div class="airport-stops">
      <div v-for="(airport, i) in modelValue.airports" :key="i" class="airport-row">
        <label class="airport-label">{{ rowLabel(i) }}</label>
        <input
          type="text"
          list="airports-datalist"
          :value="airport"
          placeholder="e.g. MANILA (MNL), PHILIPPINES"
          autocomplete="off"
          @input="updateAirport(i, $event.target.value.toUpperCase())"
        />
        <button
          v-if="modelValue.type === 'multi-city' && modelValue.airports.length > 3"
          type="button"
          class="btn-remove"
          @click="removeStop(i)"
        >
          ×
        </button>
      </div>

      <button
        v-if="modelValue.type === 'multi-city'"
        type="button"
        class="btn-add"
        @click="addStop"
      >
        + Add Stop
      </button>
    </div>

    <!-- Round-trip return indicator -->
    <p v-if="modelValue.type === 'round-trip' && modelValue.airports[0]" class="route-preview">
      Route: {{ modelValue.airports[0] || '…' }} / {{ modelValue.airports[1] || '…' }} / {{ modelValue.airports[0] }}
    </p>

    <datalist id="airports-datalist">
      <option v-for="a in AIRPORTS" :key="a" :value="a" />
    </datalist>
  </div>
</template>

<script setup>
import { AIRPORTS } from '../data/airports.js'

const ROUTE_TYPES = [
  { value: 'one-way',    label: 'One-Way' },
  { value: 'round-trip', label: 'Round-Trip' },
  { value: 'multi-city', label: 'Multi-City' },
]

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    // { type: 'one-way'|'round-trip'|'multi-city', airports: string[] }
  },
})
const emit = defineEmits(['update:modelValue'])

function rowLabel(i) {
  const { type, airports } = props.modelValue
  if (i === 0) return 'From'
  if (type === 'multi-city') {
    return i === airports.length - 1 ? 'To' : `Via ${i}`
  }
  return 'To'
}

function changeType(newType) {
  const current = props.modelValue.airports
  let airports
  if (newType === 'multi-city') {
    // Ensure at least 3 stops
    airports = [...current]
    while (airports.length < 3) airports.push('')
  } else {
    // One-way and round-trip only need 2 airports
    airports = [current[0] ?? '', current[1] ?? '']
  }
  emit('update:modelValue', { type: newType, airports })
}

function updateAirport(i, value) {
  const airports = [...props.modelValue.airports]
  airports[i] = value
  emit('update:modelValue', { ...props.modelValue, airports })
}

function addStop() {
  emit('update:modelValue', {
    ...props.modelValue,
    airports: [...props.modelValue.airports, ''],
  })
}

function removeStop(i) {
  const airports = props.modelValue.airports.filter((_, idx) => idx !== i)
  emit('update:modelValue', { ...props.modelValue, airports })
}
</script>
