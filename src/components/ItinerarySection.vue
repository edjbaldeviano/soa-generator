<template>
  <div class="itinerary-section">
    <fieldset>
      <legend>Booking References</legend>
      <div class="ref-type">
        <label v-for="opt in refTypeOptions" :key="opt" class="radio-label">
          <input
            type="radio"
            :value="opt"
            :checked="refType === opt"
            @change="emit('update:refType', opt)"
          />
          {{ opt }}
        </label>
      </div>
      <div v-for="(_, i) in passengers" :key="i" class="ref-row">
        <label :for="`ref-${i}`">{{ passengers[i] || `Passenger ${i + 1}` }}</label>
        <input
          :id="`ref-${i}`"
          :value="refs[i] || ''"
          type="text"
          placeholder="Ticket / booking reference"
          @input="updateRef(i, $event.target.value)"
        />
      </div>
    </fieldset>

    <fieldset>
      <legend>Itinerary</legend>
      <div class="field-row">
        <label>Airline</label>
        <input
          :value="modelValue.airline"
          type="text"
          placeholder="PHILIPPINE AIRLINES"
          @input="updateField('airline', $event.target.value)"
        />
      </div>
      <div class="field-row">
        <label>Flight No.</label>
        <input
          :value="modelValue.flightNumber"
          type="text"
          placeholder="438"
          @input="updateField('flightNumber', $event.target.value)"
        />
      </div>
      <div class="field-row">
        <label>Route</label>
        <input
          :value="modelValue.route"
          type="text"
          placeholder="MANILA/NAGOYA/MANILA"
          @input="updateField('route', $event.target.value)"
        />
      </div>
      <div class="field-row">
        <label>Travel Date</label>
        <input
          :value="modelValue.travelDate"
          type="text"
          placeholder="May 30"
          @input="updateField('travelDate', $event.target.value)"
        />
      </div>
      <div class="field-row">
        <label>Dep. Time</label>
        <input
          :value="modelValue.depTime"
          type="text"
          placeholder="0700"
          @input="updateField('depTime', $event.target.value)"
        />
      </div>
      <div class="field-row">
        <label>Arr. Time</label>
        <input
          :value="modelValue.arrTime"
          type="text"
          placeholder="1210"
          @input="updateField('arrTime', $event.target.value)"
        />
      </div>
      <div class="field-row">
        <label>Class</label>
        <select
          :value="modelValue.travelClass"
          @change="updateField('travelClass', $event.target.value)"
        >
          <option>Economy Class</option>
          <option>Business Class</option>
          <option>First Class</option>
        </select>
      </div>
    </fieldset>
  </div>
</template>

<script setup>
const REF_TYPE_OPTIONS = ['Ticket No.', 'Ticket Nos.', 'Booking Reference No.', 'Booking Reference Nos.']

const props = defineProps({
  modelValue: { type: Object, required: true },
  refType: { type: String, required: true },
  refs: { type: Array, required: true },
  passengers: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'update:refType', 'update:refs'])

const refTypeOptions = REF_TYPE_OPTIONS

function updateField(field, value) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

function updateRef(i, value) {
  const next = [...props.refs]
  while (next.length <= i) next.push('')
  next[i] = value
  emit('update:refs', next)
}
</script>
