import { CustomerFooter } from './customer-footer'
import { CustomerHeader } from './customer-header'
import { CONTAINER, MAIN_ID } from './customer-nav'

type CustomerLayoutProps = { children: React.ReactNode }

export function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <CustomerHeader />
      <main id={MAIN_ID} tabIndex={-1} className={`${CONTAINER} flex-1 outline-none`}>
        {children}
      </main>
      <CustomerFooter />
    </div>
  )
}
