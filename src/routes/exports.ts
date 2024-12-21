export type route = {
    path: string;
    handler: any;
    method:
        | "get"
        | "post"
        | "put"
        | "delete"
        | "patch"
        | "options"
        | "head"
        | "all";
};

export const routes: route[] = [
    {
        path: "/v1/auth/signup",
        handler: require("./v1/auth/signup.js").default,
        method: "post",
    },
];
