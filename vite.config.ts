// @ts-ignore
import reactRefresh from '@vitejs/plugin-react-refresh'
import {defineConfig} from 'vite'

export default defineConfig({
    plugins: [reactRefresh()],
    esbuild: {
        jsxInject: "import React from 'react'", // 为每个 tsx jsx 自动引入 React，不用手动引入了
    },
})
