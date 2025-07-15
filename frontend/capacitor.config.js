const config = {
  appId: 'com.wellness.buddy',
  appName: 'wellness-buddy',
  webDir: 'build',
  bundledWebRuntime: false,
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '155478550721-suf2sas620qebja2hbplfh20gktmom1k.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

module.exports = config;
