import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    project: ["create", "share", "update", "delete"],
} as const;
const ac = createAccessControl(statement)
const provider = ac.newRole({
    project: ["create", "share", "update", "delete"],
})
const customer = ac.newRole({
    project: ["create", "share", "update", "delete"],
})

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        adminClient({
            ac,
            roles: {
              customer,
              provider
            },
        })
    ]
})
