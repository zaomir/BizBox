// PM2 Ecosystem Configuration
// Run with: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'bizbox-api',
      script: './backend/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },

      // Restart policy
      max_memory_restart: '500M',
      max_restarts: 10,
      min_uptime: '10s',

      // Logging
      output: './logs/pm2-out.log',
      error: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Development only
      ignore_watch: ['node_modules', '.git', 'logs'],
      watch: false,

      // Advanced
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',

      // Cron restart (daily at 3 AM)
      cron_restart: '0 3 * * *'
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: '213.155.28.121',
      key: '/path/to/ssh/key',
      ref: 'origin/main',
      repo: 'https://github.com/zaomir/BizBox.git',
      path: '/var/www/bizbox',
      'post-deploy': 'npm install && npm run build',
      'pre-deploy-local': 'echo "Deploying to production"'
    },
    staging: {
      user: 'root',
      host: '213.155.28.121',
      key: '/path/to/ssh/key',
      ref: 'origin/develop',
      repo: 'https://github.com/zaomir/BizBox.git',
      path: '/var/www/bizbox-staging',
      'post-deploy': 'npm install',
      'pre-deploy-local': 'echo "Deploying to staging"'
    }
  }
};
