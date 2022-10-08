module.exports = {
  apps: [
    {
      name: 'tgPostsNotifierUserBot',
      script: 'src/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '3G',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
