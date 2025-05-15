import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/drizzle/db'
import { schema } from '@/drizzle/schema'
import { nextCookies } from 'better-auth/next-js'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: schema }),
  socialProviders: {
    // google: {
    //   clientId: '',
    //   clientSecret: '',
    // }
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string
    }
  },
  plugins: [nextCookies()],
  baseURL: process.env.NEXT_PUBLIC_BASE_PATH
})
