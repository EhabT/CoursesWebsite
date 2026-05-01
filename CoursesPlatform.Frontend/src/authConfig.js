export const msalConfig = {
    auth: {
        clientId: "f44f7776-901b-48a7-be3a-ee2a9e21b35e", // Courses Frontend App ID
        authority: "https://5fa0aed9-6ad3-43aa-b026-cc965293e870.ciamlogin.com/5fa0aed9-6ad3-43aa-b026-cc965293e870/v2.0", // External Tenant ID
        redirectUri: "/", 
        postLogoutRedirectUri: "/",
        navigateToLoginRequestUrl: true, 
    },
    cache: {
        cacheLocation: "sessionStorage", 
        storeAuthStateInCookie: false,
    }
};

export const loginRequest = {
    scopes: ["api://a3315a3b-660f-4fcd-9705-04a3df3f3c89/access_as_user"] // Backend API scope
};
