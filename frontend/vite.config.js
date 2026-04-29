import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material/AdminPanelSettingsOutlined',
      '@mui/icons-material/SecurityRounded',
      '@mui/icons-material/SettingsSuggestRounded',
      '@mui/icons-material/BusinessOutlined',
      '@mui/icons-material/ReceiptLongRounded',
    ],
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
