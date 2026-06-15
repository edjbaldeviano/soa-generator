<template>
  <div id="app">
    <header class="app-header">
      <h1>SOA Generator</h1>
      <p>Fill in the form below, then click <strong>Generate DOCX</strong> to download.</p>
    </header>
    <SoaForm />
  </div>
</template>

<script setup>
import SoaForm from './components/SoaForm.vue'
</script>
