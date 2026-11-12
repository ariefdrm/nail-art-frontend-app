import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useLogoutAllMutation } from '@/features/auth/queries'
import { errorMessage } from '@/lib/api/errors'

type ConfirmLogoutAllProps = { onDone: () => void }

export function ConfirmLogoutAll({ onDone }: ConfirmLogoutAllProps) {
  const logoutAll = useLogoutAllMutation()

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" size="lg" />}>
        Keluar dari semua perangkat
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keluar dari semua perangkat?</AlertDialogTitle>
          <AlertDialogDescription>
            Semua sesi Anda berakhir, termasuk di perangkat ini. Anda perlu masuk lagi di setiap
            perangkat.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Kembali</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              logoutAll.mutate(undefined, {
                onSuccess: onDone,
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            Keluar dari semua
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
