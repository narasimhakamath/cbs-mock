module.exports = {
  apps: [
    {
      name: 'cbs-backend',
      cwd: './server',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'cbs-frontend',
      cwd: './client',
      script: 'node_modules/.bin/serve',
      args: '-s dist -l 3000',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
