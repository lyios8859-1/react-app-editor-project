const path = require('path');
import reactRefresh from '@vitejs/plugin-react-refresh';
import { defineConfig } from 'vite';
import styleImport from 'vite-plugin-style-import';

export default defineConfig({
    plugins: [
        reactRefresh(),
        // styleImport({
        //     libs: [
        //         {
        //             libraryName: 'antd',
        //             esModule: true,
        //             resolveStyle: (name) => {
        //                 return `antd/es/${name}/style`;
        //             },
        //         }
        //     ]
        // }),
    ],
    // css: {
    //     preprocessorOptions: {
    //         less: {
    //             javascriptEnabled: true
    //         }
    //     }
    // },
    esbuild: {
        jsxInject: "import React from 'react'", // 为每个 tsx jsx 自动引入 React，不用手动引入了
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@assets": path.resolve(__dirname, "src/assets"),
            "@components": path.resolve(__dirname, "src/components"),
            "@images": path.resolve(__dirname, "src/assets/images"),
            "@views": path.resolve(__dirname, "src/views"),
            "@store": path.resolve(__dirname, "src/store"),
        }
    },
    server: {
        https: false, // 是否开启 https
        open: true, // 是否自动在浏览器打开
        port: 3000, // 端口号
        host: "0.0.0.0",
        hmr: {
            overlay: true, // 是否开启错误的阴影层
        }
    },
    optimizeDeps: {
        include: [] // 第三方库
    },
    build: {
        chunkSizeWarningLimit: 2000,
        terserOptions: {
            // 生产环境移除console
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output:{
                // manualChunks(id) {
                //     if (id.includes('node_modules')) {
                //         return id.toString().split('node_modules/')[1].split('/')[0].toString();
                //     }
                // }
                manualChunks: {
                    react: ['react', 'react-dom'],
                    antd: ['antd']
                }
            }
        }
    }

})
