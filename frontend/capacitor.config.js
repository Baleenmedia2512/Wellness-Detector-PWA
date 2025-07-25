const config = {
  appId: 'com.wellnessbuddy.app',
  appName: 'Wellness Buddy',
  webDir: 'build',
  bundledWebRuntime: false,
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#e6f4ea',
      overlaysWebView: false
    },
    SocialLogin: {
      providers: {
        google: {
          webClientId: '610941252952-u9h8srgfr879aucl4sbc8h3f6i68cq7n.apps.googleusercontent.com',
          androidClientId: '610941252952-glm3ubnme6bs3cithddg0b6vnq8sojq3.apps.googleusercontent.com'
        }
      }
    }
  }
};

module.exports = config;
