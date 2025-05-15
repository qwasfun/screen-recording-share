import React, { ReactNode } from 'react'
import Navbar from '@/components/Navbar'

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div>
      <Navbar />
      <div>{children}</div>
    </div>
  )
}

export default Layout
