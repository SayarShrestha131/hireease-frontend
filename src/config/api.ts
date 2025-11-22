interface ApiConfig {
  baseURL: string;
  timeout: number;
}

const config: ApiConfig = {
  baseURL: __DEV__
    ? 'http://10.0.2.2:3000/api' // Android emulator - maps to host machine's localhost
    : 'https://api.production.com/api', // Production URL - update with actual production URL
  timeout: 10000, // 10 seconds
};

export default config;
