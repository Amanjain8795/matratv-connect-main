// Production console cleanup utility
export const logDev = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(message, ...args);
  }
};

export const warnDev = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.warn(message, ...args);
  }
};

export const errorDev = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.error(message, ...args);
  }
};

// Clean up console in production
if (import.meta.env.PROD) {
  // Override console methods in production to reduce bundle size
  console.log = () => {};
  console.warn = () => {};
  // Keep console.error for important error tracking
}
