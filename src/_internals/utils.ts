declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      type?: string;
    }
  }
}


export function isBrowser(): boolean {
  // Check if the current environment is Node.js
  if(typeof process !== 'undefined' && process?.versions?.node) return false;

  // Check if the current environment is a browser
  if(typeof window !== 'undefined'
    && typeof window === 'object' &&
    !!window.document) return true;

  // Check for other browser-like environments (e.g., Electron renderer process)
  if(typeof process !== 'undefined' && typeof process?.type === 'string' && process?.type === 'renderer') return true;

  // Add additional checks for specific browser-like environments if needed

  // Assume Node.js environment if not running in a browser-like environment
  return false;
}

export function strShuffle(str: string): string {
  const arr = str.split('');

  // Loop through the array
  for (let i = arr.length - 1; i > 0; i--) {
    // Generate a random index
    const j = Math.floor(Math.random() * (i + 1));

    // Swap the current element with the random element
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  // Convert the array back to a string and return it
  return arr.join('');
}
