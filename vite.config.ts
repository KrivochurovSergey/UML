import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// В продакшене на GitHub Pages путь = /UML/ (название репозитория)
// В дев-режиме — корень /
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/UML/' : '/',
})
