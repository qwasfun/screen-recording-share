'use client'
import Image from 'next/image'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

const Page = () => {
  // const handleGoogleSignIn = async () => {
  //   return await authClient.signIn.social({ provider: 'google' })
  // }
  const handleGithubSignIn = async () => {
    return await authClient.signIn.social({ provider: 'github' })
  }
  return (
    <main className="sign-in">
      <div className="google-sign-in">
        <section>
          <Link href="/">
            <Image
              src="/assets/icons/logo.svg"
              alt="logo"
              width={40}
              height={40}
            />
            <h1>Screen Recording</h1>
          </Link>
          <p>
            Create and share your very first <span>Screen Recording video</span> in no
            time!
          </p>
          {/* <button onClick={handleGoogleSignIn}>
            <Image
              src="/assets/icons/google.svg"
              alt="google"
              width={22}
              height={22}
            />
            <span>Sign in with Google</span>
          </button> */}
          <button onClick={handleGithubSignIn}>
            <Image
              src="/assets/icons/github.svg"
              alt="Github"
              width={22}
              height={22}
            />
            <span>Sign in with Github</span>
          </button>
        </section>
      </div>
    </main>
  )
}

export default Page
