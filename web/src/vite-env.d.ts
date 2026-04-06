/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Default Pi base URL (e.g. http://192.168.1.50:5000) when not saved in Settings */
  readonly VITE_PI_BASE_URL?: string;
  /** Path on the Pi for the web login screen, e.g. `login` → `/login` */
  readonly VITE_PI_LOGIN_PATH?: string;
}
