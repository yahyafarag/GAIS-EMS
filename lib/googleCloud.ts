
// This utility handles the connection to Google's API (Sheets & Drive)
// You must set VITE_GOOGLE_API_KEY and VITE_GOOGLE_CLIENT_ID in your .env file

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Safely access env to avoid "Cannot read properties of undefined"
const env = (import.meta as any).env || {};
const API_KEY = (env.VITE_GOOGLE_API_KEY || '').trim();
const CLIENT_ID = (env.VITE_GOOGLE_CLIENT_ID || '').trim();

// Scopes required: Reading/Writing Drive files, Reading/Writing Spreadsheets
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY_DOCS = [
    'https://sheets.googleapis.com/$discovery/rest?version=v4',
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
];

let gapiInited = false;
let gisInited = false;
let tokenClient: any;

export const googleCloud = {
    isInitialized: false,

    initClient: async () => {
        return new Promise<void>((resolve, reject) => {
            // Validation: Don't crash if keys are missing, just warn
            if (!API_KEY) console.warn("VITE_GOOGLE_API_KEY is not set in .env");
            if (!CLIENT_ID) console.warn("VITE_GOOGLE_CLIENT_ID is not set in .env");

            if (!window.gapi) {
                console.error("Google API Script not loaded");
                // Allow graceful failure
                reject(new Error("Google API Script not loaded"));
                return;
            }

            window.gapi.load('client', async () => {
                try {
                    if (API_KEY) {
                        await window.gapi.client.init({
                            apiKey: API_KEY,
                            discoveryDocs: DISCOVERY_DOCS,
                        });
                    }
                    gapiInited = true;
                    googleCloud.checkInit(resolve);
                } catch (err) {
                    console.error("GAPI Client Init Error:", err);
                    // Mark as inited to prevent hanging, even if failed
                    gapiInited = true;
                    googleCloud.checkInit(resolve);
                }
            });

            if (window.google) {
                try {
                    if (CLIENT_ID) {
                        tokenClient = window.google.accounts.oauth2.initTokenClient({
                            client_id: CLIENT_ID,
                            scope: SCOPES,
                            callback: '', // defined later
                        });
                    } else {
                        console.warn("Skipping GIS Init: Missing Client ID");
                    }
                    gisInited = true;
                    googleCloud.checkInit(resolve);
                } catch (err) {
                    console.error("GIS Init Error:", err);
                    // Mark as inited to prevent hanging
                    gisInited = true;
                    googleCloud.checkInit(resolve);
                }
            } else {
                console.warn("Google Identity Services script not loaded");
                gisInited = true;
                googleCloud.checkInit(resolve);
            }
        });
    },

    checkInit: (resolve: any) => {
        if (gapiInited && gisInited) {
            googleCloud.isInitialized = true;
            resolve();
        }
    },

    signIn: async () => {
        return new Promise<void>((resolve, reject) => {
            if (!tokenClient) {
                return reject(new Error("Token Client not initialized (Check VITE_GOOGLE_CLIENT_ID)"));
            }
            
            tokenClient.callback = async (resp: any) => {
                if (resp.error) {
                    reject(resp);
                }
                resolve();
            };

            // Request access token (triggers popup if needed)
            if (window.gapi.client.getToken() === null) {
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                tokenClient.requestAccessToken({prompt: ''});
            }
        });
    },

    signOut: () => {
        const token = window.gapi.client.getToken();
        if (token !== null) {
            window.google.accounts.oauth2.revoke(token.access_token);
            window.gapi.client.setToken('');
        }
    },

    // Check if user is signed in
    isSignedIn: () => {
        return window.gapi && window.gapi.client && window.gapi.client.getToken() !== null;
    }
};
