'use client'

import Image from 'next/image'
import Link from 'next/link'
import { redirect, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

const Navbar = () => {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const user = session?.user

  return (
    <header className="navbar">
      <nav>
        <Link href="/">
          <Image
            src="/assets/icons/logo.svg"
            alt="Logo"
            width={32}
            height={32}
          />
          Screen Recorder
        </Link>
        {user && (
          <figure>
            <button onClick={() => router.push(`/profile/${user.id}`)}>
              <Image
                src={user.image || '/assets/images/dummy.jpg'}
                alt="User"
                width={36}
                height={36}
                className="rounded-full aspect-square"
              />
            </button>
            <button
              className="cursor-pointer"
              onClick={async () => {
                return await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      redirect('/login')
                    }
                  }
                })
              }}
            >
              <Image
                src="/assets/icons/logout.svg"
                alt="logout"
                width={36}
                height={36}
                className="rotate-180"
              />
            </button>
          </figure>
        )}
      </nav>
    </header>
  )
}

export default Navbar
