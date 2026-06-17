<template>
  <form class="soa-form" @submit.prevent="handleGenerate">

    <!-- Type -->
    <section class="form-section">
      <h2>Document Type</h2>
      <div class="toggle-group">
        <label class="toggle-label" :class="{ active: form.type === 'airfare' }">
          <input v-model="form.type" type="radio" value="airfare" /> Airfare
        </label>
        <label class="toggle-label" :class="{ active: form.type === 'visa' }">
          <input v-model="form.type" type="radio" value="visa" /> Visa
        </label>
      </div>
    </section>

    <!-- Client Details -->
    <section class="form-section">
      <h2>Client Details</h2>
      <div class="field-row">
        <label for="client-name">Client Name</label>
        <input
          id="client-name"
          v-model="form.clientName"
          list="clients-datalist"
          type="text"
          placeholder="Type or select client"
          autocomplete="off"
          @input="onClientSelect"
        />
        <datalist id="clients-datalist">
          <option v-for="c in CLIENTS" :key="c.name" :value="c.name" />
        </datalist>
      </div>
      <div class="field-row">
        <label for="address">Address</label>
        <textarea id="address" v-model="form.address" rows="2" />
      </div>
      <div class="field-row">
        <label for="soa-date">Date</label>
        <input id="soa-date" v-model="form.date" type="date" />
      </div>
    </section>

    <!-- Passengers -->
    <section class="form-section">
      <h2>Passengers</h2>
      <PassengerList
        :model-value="form.passengers"
        @update:model-value="form.passengers = $event"
        @remove="onPassengerRemove"
        @add="form.refs.push([''])"
      />
    </section>

    <!-- Airfare-only: Booking refs + Itinerary -->
    <section v-if="form.type === 'airfare'" class="form-section">
      <h2>Booking & Itinerary</h2>
      <ItinerarySection
        v-model="form.itinerary"
        v-model:ref-type="form.refType"
        v-model:refs="form.refs"
        :passengers="passengerNames"
      />
    </section>

    <!-- Fee Line Items -->
    <section class="form-section">
      <h2>Fee Items</h2>
      <div class="toggle-group currency-toggle">
        <label class="toggle-label" :class="{ active: form.currency === 'PHP' }">
          <input v-model="form.currency" type="radio" value="PHP" /> PHP
        </label>
        <label class="toggle-label" :class="{ active: form.currency === 'USD' }">
          <input v-model="form.currency" type="radio" value="USD" /> USD
        </label>
      </div>
      <FeeTable v-model="form.fees" :default-qty="form.passengers.length" />
    </section>

    <!-- Optional Note -->
    <section class="form-section">
      <h2>Note <span class="optional">(optional)</span></h2>
      <textarea v-model="form.note" rows="2" placeholder="e.g. Withholding tax is not included." />
    </section>

    <!-- Error message -->
    <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

    <!-- Generate -->
    <button type="submit" class="btn-generate" :disabled="generating">
      {{ generating ? 'Generating…' : 'Generate DOCX' }}
    </button>

  </form>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { CLIENTS } from '../data/clients.js'
import { generateSoa } from '../composables/useDocxGenerator.js'
import PassengerList from './PassengerList.vue'
import FeeTable from './FeeTable.vue'
import ItinerarySection from './ItinerarySection.vue'

const form = reactive({
  type: 'airfare',
  currency: 'PHP',
  clientName: '',
  address: '',
  date: '',
  passengers: [{ lastName: '', firstName: '', label: 'MR' }],
  refType: 'Ticket No.',
  refs: [['']],
  itinerary: {
    flights: [{ airline: '', flightNumber: '' }],
    routeType: 'round-trip',
    airports: ['', ''],
    travelDate: '',
    depTime: '',
    arrTime: '',
    travelClass: 'Economy Class',
  },
  fees: [{ description: '', unitAmount: '', qty: 1 }],
  note: '',
})

const errorMsg = ref('')
const generating = ref(false)

function formatPassengerName(p) {
  const last = p.lastName.trim().toUpperCase()
  const first = p.firstName.trim().toUpperCase()
  const lbl = p.label.trim().toUpperCase()
  return [last, first ? `/${first}` : '', lbl ? ` ${lbl}` : ''].join('')
}

const passengerNames = computed(() => form.passengers.map(formatPassengerName))

function onPassengerRemove(i) {
  form.refs.splice(i, 1)
}

function onClientSelect() {
  const match = CLIENTS.find((c) => c.name === form.clientName)
  if (match) form.address = match.address
}

function validate() {
  if (!form.clientName.trim()) return 'Client name is required.'
  if (!form.date) return 'Date is required.'
  if (form.passengers.some((p) => !p.lastName.trim())) return 'All passenger last names must be filled in.'
  if (form.type === 'airfare') {
    if (form.itinerary.flights.some((f) => !f.airline.trim()) || !form.itinerary.travelDate) {
      return 'All airline fields and travel date are required for airfare SOAs.'
    }
    if (form.itinerary.airports.some((a) => !a.trim())) {
      return 'All route airports must be filled in.'
    }
    if (form.refs.some((r) => r.some((t) => !t.trim()))) return 'All booking references must be filled in.'
  }
  if (form.fees.length === 0) return 'At least one fee row is required.'
  if (form.fees.some((f) => !f.description.trim())) return 'All fee descriptions must be filled in.'
  return null
}

async function handleGenerate() {
  errorMsg.value = validate() || ''
  if (errorMsg.value) return

  generating.value = true
  try {
    await generateSoa({ ...form, passengers: passengerNames.value })
  } catch (err) {
    errorMsg.value = 'Failed to generate document: ' + err.message
  } finally {
    generating.value = false
  }
}
</script>
