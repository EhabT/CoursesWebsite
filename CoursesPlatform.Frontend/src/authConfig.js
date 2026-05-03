export const msalConfig = {
    auth: {
        clientId: "f44f7776-901b-48a7-be3a-ee2a9e21b35e",
        authority: "https://coursesappehab.ciamlogin.com/5fa0aed9-6ad3-43aa-b026-cc965293e870/v2.0",
        redirectUri: window.location.origin + "/",
        postLogoutRedirectUri: window.location.origin + "/",
        navigateToLoginRequestUrl: false, // Must be false for CIAM popup flow
    },
    cache: {
        cacheLocation: "localStorage",   // localStorage survives popup closure
        storeAuthStateInCookie: true,     // Needed for some browsers that block 3rd-party cookies
    }
};

// Scopes used during login.
const apiScopes = ["api://a3315a3b-660f-4fcd-9705-04a3df3f3c89/access_as_user"];

export const loginRequest = {
    scopes: ["openid", "profile", "offline_access", ...apiScopes]
};

// Scopes used to silently get an access token for the .NET backend
export const apiRequest = {
    scopes: apiScopes
};
