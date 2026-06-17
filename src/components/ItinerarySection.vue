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
            @change="changeRefType(opt)"
          />
          {{ opt }}
        </label>
      </div>
      <!-- Ticket mode: multiple per passenger -->
      <template v-if="isTicketMode">
        <div v-for="(_, i) in passengers" :key="i" class="ref-row ref-row-tickets">
          <label>{{ passengers[i] || `Passenger ${i + 1}` }}</label>
          <div class="ticket-inputs">
            <div v-for="(_, j) in (refs[i] || [''])" :key="j" class="ticket-row">
              <input
                :id="j === 0 ? `ref-${i}` : undefined"
                :value="(refs[i] || [''])[j] || ''"
                type="text"
                placeholder="Ticket number"
                @input="updateRef(i, j, $event.target.value)"
              />
              <button
                v-if="(refs[i] || ['']).length > 1"
                type="button"
                class="btn-remove"
                @click="removeTicket(i, j)"
              >×</button>
            </div>
            <button type="button" class="btn-add" @click="addTicket(i)">+ Add Ticket</button>
          </div>
        </div>
      </template>
      <!-- Non-ticket mode: single ref per passenger -->
      <template v-else>
        <div v-for="(_, i) in passengers" :key="i" class="ref-row">
          <label :for="`ref-${i}`">{{ passengers[i] || `Passenger ${i + 1}` }}</label>
          <input
            :id="`ref-${i}`"
            :value="(refs[i] || [''])[0] || ''"
            type="text"
            placeholder="Ticket / booking reference"
            @input="updateRef(i, 0, $event.target.value)"
          />
        </div>
      </template>
    </fieldset>

    <fieldset>
      <legend>Itinerary</legend>

      <!-- Airline(s) + Flight Numbers -->
      <div class="field-row flights-field-row">
        <label>Airline / Flight</label>
        <div class="flight-rows">
          <div v-for="(f, i) in modelValue.flights" :key="i" class="flight-row">
            <input
              type="text"
              list="airlines-datalist"
              :value="f.airline"
              placeholder="PHILIPPINE AIRLINES"
              autocomplete="off"
              class="airline-input"
              @input="updateFlight(i, 'airline', $event.target.value.toUpperCase())"
            />
            <input
              type="text"
              :value="f.flightNumber"
              placeholder="438"
              class="flight-num-input"
              @input="updateFlight(i, 'flightNumber', $event.target.value)"
            />
            <button
              v-if="modelValue.flights.length > 1"
              type="button"
              class="btn-remove"
              @click="removeFlight(i)"
            >
              ×
            </button>
          </div>
          <button type="button" class="btn-add" @click="addFlight">+ Add Airline</button>
        </div>
        <datalist id="airlines-datalist">
          <option v-for="a in AIRLINES" :key="a" :value="a" />
        </datalist>
      </div>

      <div class="field-row route-field-row">
        <label>Route</label>
        <RouteInput
          :model-value="{ type: modelValue.routeType, airports: modelValue.airports }"
          @update:model-value="updateRoute"
        />
      </div>
      <div class="field-row">
        <label>Travel Date</label>
        <input
          :value="modelValue.travelDate"
          type="date"
          @input="updateField('travelDate', $event.target.value)"
        />
      </div>
      <div class="field-row">
        <label>Dep. Time</label>
        <input
          :value="modelValue.depTime"
          type="time"
          @input="updateField('depTime', $event.target.value)"
        />
      </div>
      <div class="field-row">
        <label>Arr. Time</label>
        <input
          :value="modelValue.arrTime"
          type="time"
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
import { computed } from 'vue'
import { AIRLINES } from '../data/airlines.js'
import RouteInput from './RouteInput.vue'

const REF_TYPE_OPTIONS = ['Ticket No.', 'Ticket Nos.', 'Booking Reference No.', 'Booking Reference Nos.']
const TICKET_TYPES = new Set(['Ticket No.', 'Ticket Nos.'])

const props = defineProps({
  modelValue: { type: Object, required: true },
  refType: { type: String, required: true },
  refs: { type: Array, required: true },
  passengers: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'update:refType', 'update:refs'])

const refTypeOptions = REF_TYPE_OPTIONS
const isTicketMode = computed(() => TICKET_TYPES.has(props.refType))

function updateField(field, value) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

function updateFlight(i, field, value) {
  const flights = [...props.modelValue.flights]
  flights[i] = { ...flights[i], [field]: value }
  emit('update:modelValue', { ...props.modelValue, flights })
}

function addFlight() {
  emit('update:modelValue', {
    ...props.modelValue,
    flights: [...props.modelValue.flights, { airline: '', flightNumber: '' }],
  })
}

function removeFlight(i) {
  emit('update:modelValue', {
    ...props.modelValue,
    flights: props.modelValue.flights.filter((_, idx) => idx !== i),
  })
}

function updateRoute({ type, airports }) {
  emit('update:modelValue', { ...props.modelValue, routeType: type, airports })
}

function changeRefType(opt) {
  emit('update:refType', opt)
  if (!TICKET_TYPES.has(opt)) {
    emit('update:refs', props.refs.map(r => [r[0] || '']))
  }
}

function updateRef(passengerIdx, ticketIdx, value) {
  const next = [...props.refs]
  const tickets = [...(next[passengerIdx] || [''])]
  tickets[ticketIdx] = value
  next[passengerIdx] = tickets
  emit('update:refs', next)
}

function addTicket(passengerIdx) {
  const next = [...props.refs]
  next[passengerIdx] = [...(next[passengerIdx] || ['']), '']
  emit('update:refs', next)
}

function removeTicket(passengerIdx, ticketIdx) {
  const next = [...props.refs]
  next[passengerIdx] = next[passengerIdx].filter((_, idx) => idx !== ticketIdx)
  emit('update:refs', next)
}
</script>
