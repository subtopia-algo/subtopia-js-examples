/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, options) => {
        config.module.noParse = [
            require.resolve("typescript/lib/typescript.js"),
        ];
        return config;
    },
    images: {
        domains: ["ipfs.io"],
    },
};

module.exports = nextConfig;
