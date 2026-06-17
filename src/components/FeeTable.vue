<template>
  <div class="fee-table">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Unit Amount</th>
          <th>Qty</th>
          <th>Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in modelValue" :key="i">
          <td>
            <input
              :value="row.description"
              type="text"
              placeholder="e.g. Airfare"
              @input="updateRow(i, 'description', $event.target.value)"
            />
          </td>
          <td>
            <input
              :value="row.unitAmount"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              @input="updateRow(i, 'unitAmount', $event.target.value)"
            />
          </td>
          <td>
            <input
              :value="row.qty"
              type="number"
              min="1"
              @input="updateRow(i, 'qty', parseInt($event.target.value) || 1)"
            />
          </td>
          <td class="total-cell">{{ formatAmount(row.unitAmount * row.qty) }}</td>
          <td>
            <button
              v-if="modelValue.length > 1"
              type="button"
              class="btn-remove"
              @click="removeRow(i)"
            >
              ×
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="fee-footer">
      <button type="button" class="btn-add" @click="addRow">+ Add Fee Row</button>
      <span class="grand-total">Grand Total: {{ grandTotal }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, required: true },
  defaultQty: { type: Number, default: 1 },
})
const emit = defineEmits(['update:modelValue'])

const grandTotal = computed(() =>
  props.modelValue
    .reduce((sum, row) => sum + Number(row.unitAmount) * Number(row.qty), 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
)

function formatAmount(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function updateRow(i, field, value) {
  const next = [...props.modelValue]
  next[i] = { ...next[i], [field]: value }
  emit('update:modelValue', next)
}

function addRow() {
  emit('update:modelValue', [
    ...props.modelValue,
    { description: '', unitAmount: '', qty: props.defaultQty },
  ])
}

function removeRow(i) {
  emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
}
</script>
